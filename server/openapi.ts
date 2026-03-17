import type { MarketplaceServerConfig } from './config.ts';

function serverUrl(config: MarketplaceServerConfig) {
  return config.publicOrigin.replace(/\/+$/, '');
}

export function buildOpenApiSpec(config: MarketplaceServerConfig) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'ClawPark Marketplace API',
      version: '1.0.0',
      description:
        'OpenAPI document for the ClawPark marketplace server, including auth/session, marketplace publish flows, bundle download, and OpenClaw skill installation.',
    },
    servers: [{ url: serverUrl(config) }],
    tags: [
      { name: 'auth', description: 'Discord auth session and OAuth routes.' },
      { name: 'marketplace', description: 'Marketplace listings, drafts, bundles, and install routes.' },
      { name: 'docs', description: 'OpenAPI and human-readable API docs.' },
    ],
    components: {
      securitySchemes: {
        cookieSession: {
          type: 'apiKey',
          in: 'cookie',
          name: 'clawpark_session',
          description: 'Session cookie set after Discord login.',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            overwriteRequired: { type: 'boolean' },
            installedPath: { type: 'string' },
          },
          required: ['error'],
        },
        MarketplaceSession: {
          type: 'object',
          properties: {
            user: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    kind: { type: 'string' },
                    displayName: { type: 'string' },
                    avatarUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    profileUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    discordHandle: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  },
                  required: ['id', 'kind', 'displayName'],
                },
              ],
            },
            authConfigured: { type: 'boolean' },
          },
          required: ['user', 'authConfigured'],
        },
        MarketplaceDraft: {
          type: 'object',
          description: 'Verified claw draft returned after parsing an uploaded OpenClaw workspace ZIP.',
          additionalProperties: true,
        },
        MarketplaceListing: {
          type: 'object',
          description: 'Marketplace listing union for claw and skill listings.',
          additionalProperties: true,
        },
        MarketplaceBundle: {
          type: 'object',
          description: 'Bundle payload for a marketplace listing. Claw bundles return JSON; skill bundles download as ZIP.',
          additionalProperties: true,
        },
        SkillInstallRequest: {
          type: 'object',
          properties: {
            overwrite: {
              type: 'boolean',
              description: 'When true, replaces an existing installed skill directory.',
              default: false,
            },
          },
        },
        SkillInstallResult: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', const: true },
            slug: { type: 'string' },
            skillSlug: { type: 'string' },
            installedPath: { type: 'string' },
            overwritten: { type: 'boolean' },
          },
          required: ['ok', 'slug', 'skillSlug', 'installedPath', 'overwritten'],
        },
      },
    },
    paths: {
      '/api/openapi.json': {
        get: {
          tags: ['docs'],
          summary: 'Get the OpenAPI document',
          responses: {
            200: {
              description: 'OpenAPI JSON',
              content: {
                'application/json': {
                  schema: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      },
      '/api/docs': {
        get: {
          tags: ['docs'],
          summary: 'Get the HTML API docs page',
          responses: {
            200: {
              description: 'Swagger-like HTML docs powered by ReDoc',
              content: {
                'text/html': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/api/auth/session': {
        get: {
          tags: ['auth'],
          summary: 'Get current auth session',
          responses: {
            200: {
              description: 'Current marketplace auth session',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceSession' },
                },
              },
            },
          },
        },
      },
      '/api/auth/discord/start': {
        get: {
          tags: ['auth'],
          summary: 'Start Discord OAuth',
          responses: {
            302: { description: 'Redirects to Discord OAuth' },
            503: {
              description: 'Discord OAuth is not configured',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/auth/discord/callback': {
        get: {
          tags: ['auth'],
          summary: 'Handle Discord OAuth callback',
          responses: {
            302: { description: 'Redirects back to the ClawPark client after login' },
            400: {
              description: 'OAuth state mismatch',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['auth'],
          summary: 'Log out the current session',
          responses: {
            200: {
              description: 'Logout confirmation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { ok: { type: 'boolean' } },
                    required: ['ok'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/drafts': {
        post: {
          tags: ['marketplace'],
          summary: 'Create a verified claw draft from an OpenClaw workspace ZIP',
          security: [{ cookieSession: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    bundle: {
                      type: 'string',
                      format: 'binary',
                      description: 'OpenClaw workspace ZIP',
                    },
                  },
                  required: ['bundle'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Draft created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceDraft' },
                },
              },
            },
            401: {
              description: 'Requires Discord login',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/marketplace/ingest/claw': {
        post: {
          tags: ['marketplace'],
          summary: 'Create an unsigned claw listing from a ZIP upload',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    bundle: { type: 'string', format: 'binary' },
                    publisherLabel: { type: 'string' },
                    title: { type: 'string' },
                    summary: { type: 'string' },
                  },
                  required: ['bundle'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Unsigned claw listing created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceListing' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/ingest/skill': {
        post: {
          tags: ['marketplace'],
          summary: 'Create an unsigned skill listing from a ZIP upload',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    bundle: { type: 'string', format: 'binary' },
                    publisherLabel: { type: 'string' },
                    title: { type: 'string' },
                    summary: { type: 'string' },
                  },
                  required: ['bundle'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Unsigned skill listing created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceListing' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/listings': {
        get: {
          tags: ['marketplace'],
          summary: 'List public marketplace listings',
          responses: {
            200: {
              description: 'Public listings',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MarketplaceListing' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}': {
        get: {
          tags: ['marketplace'],
          summary: 'Get a single marketplace listing',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Marketplace listing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceListing' },
                },
              },
            },
            404: {
              description: 'Listing not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}/bundle': {
        get: {
          tags: ['marketplace'],
          summary: 'Download a listing bundle',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Bundle download',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/MarketplaceBundle' } },
                'application/zip': { schema: { type: 'string', format: 'binary' } },
              },
            },
            404: {
              description: 'Bundle not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}/install': {
        post: {
          tags: ['marketplace'],
          summary: 'Install a marketplace skill bundle into the configured OpenClaw skills directory',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SkillInstallRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Skill installed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SkillInstallResult' },
                },
              },
            },
            400: {
              description: 'Only skill listings can be installed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            404: {
              description: 'Listing or bundle not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            409: {
              description: 'Skill already exists and overwrite was not confirmed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/marketplace/drafts/{id}': {
        get: {
          tags: ['marketplace'],
          summary: 'Get a verified claw draft',
          security: [{ cookieSession: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Draft',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceDraft' },
                },
              },
            },
          },
        },
        patch: {
          tags: ['marketplace'],
          summary: 'Update a verified claw draft',
          security: [{ cookieSession: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    toolsVisibility: { type: 'string', enum: ['full', 'summary'] },
                    coverStyle: { type: 'string', enum: ['avatar', 'containment-card'] },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Updated draft',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceDraft' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/drafts/{id}/publish': {
        post: {
          tags: ['marketplace'],
          summary: 'Publish a verified claw draft',
          security: [{ cookieSession: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            201: {
              description: 'Published listing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketplaceListing' },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function buildApiDocsHtml(specPath = '/api/openapi.json') {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClawPark API Docs</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0d1a12; }
      body { font-family: Inter, system-ui, sans-serif; }
      .topbar {
        padding: 14px 18px;
        background: #060e09;
        color: #f5f0e1;
        border-bottom: 1px solid rgba(212, 165, 55, 0.2);
      }
      .topbar a { color: #d4a537; text-decoration: none; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
  </head>
  <body>
    <div class="topbar">
      <strong>ClawPark API Docs</strong>
      <span style="margin-left: 12px; opacity: 0.8;">OpenAPI / Swagger-style docs</span>
      <span style="margin-left: 12px;"><a href="${specPath}">Raw OpenAPI JSON</a></span>
    </div>
    <redoc spec-url="${specPath}"></redoc>
  </body>
</html>`;
}
