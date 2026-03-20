function serverUrl(config: { publicOrigin: string }) {
  return config.publicOrigin.replace(/\/+$/, '');
}

export function buildOpenApiSpec(config: { publicOrigin: string }) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'ClawPark API',
      version: '1.0.0',
      description:
        'OpenAPI document for the shipped ClawPark server, including /api/v1 specimen flows, marketplace/auth routes, mock-commerce routes, bundle download, and skill installation.',
    },
    servers: [{ url: serverUrl(config) }],
    tags: [
      { name: 'v1', description: 'Specimen import, nursery, lineage, and breeding routes under /api/v1.' },
      { name: 'auth', description: 'Discord auth session and OAuth routes.' },
      { name: 'marketplace', description: 'Marketplace listings, drafts, bundles, and install routes.' },
      { name: 'mock-commerce', description: 'Mock portfolio, listing mutation, purchase, provenance, and breeding routes.' },
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
        HomePayload: {
          type: 'object',
          description: 'Current ClawPark home payload from /api/v1/home.',
          additionalProperties: true,
        },
        Specimen: {
          type: 'object',
          description: 'Normalized specimen record returned by /api/v1 specimen endpoints.',
          additionalProperties: true,
        },
        ImportRecord: {
          type: 'object',
          description: 'Import record metadata for an uploaded OpenClaw ZIP.',
          additionalProperties: true,
        },
        ImportPreview: {
          type: 'object',
          description: 'Combined import response containing specimen + import record.',
          additionalProperties: true,
        },
        EligibilityResult: {
          type: 'object',
          description: 'Breeding eligibility response for /api/v1 pair checks.',
          additionalProperties: true,
        },
        BreedingRunResult: {
          type: 'object',
          description: 'Immediate breeding execution response from /api/v1/breeding/runs.',
          additionalProperties: true,
        },
        BreedingRunRecord: {
          type: 'object',
          description: 'Stored breeding run record.',
          additionalProperties: true,
        },
        BreedingIntent: {
          type: 'object',
          description: 'Stored breeding intent for Discord/web flows.',
          additionalProperties: true,
        },
        BreedingProposal: {
          type: 'object',
          description: 'Stored breeding proposal / consent record.',
          additionalProperties: true,
        },
        LineageTree: {
          type: 'object',
          description: 'Recursive lineage tree for a specimen.',
          additionalProperties: true,
        },
        MockMe: {
          type: 'object',
          description: 'Current mock-commerce user/session payload.',
          additionalProperties: true,
        },
        MockInventoryResponse: {
          type: 'object',
          description: 'Mock inventory response from /api/my/claws.',
          additionalProperties: true,
        },
        MockListingSnapshot: {
          type: 'object',
          description: 'Mock listing snapshot used by mock-commerce browse/seller flows.',
          additionalProperties: true,
        },
        MockTransactionsResponse: {
          type: 'object',
          description: 'Mock transaction feed response.',
          additionalProperties: true,
        },
        MockPurchaseResponse: {
          type: 'object',
          description: 'Mock purchase receipt/transfer response.',
          additionalProperties: true,
        },
        MockBreedRunResponse: {
          type: 'object',
          description: 'Mock breeding response for owned specimens.',
          additionalProperties: true,
        },
        MockProvenanceResponse: {
          type: 'object',
          description: 'Mock provenance / event history for a claw.',
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
      '/api/v1/home': {
        get: {
          tags: ['v1'],
          summary: 'Get nursery/home status and suggested next actions',
          responses: {
            200: {
              description: 'Current home payload',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HomePayload' },
                },
              },
            },
          },
        },
      },
      '/api/v1/imports/openclaw': {
        post: {
          tags: ['v1'],
          summary: 'Import an OpenClaw workspace ZIP',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    discord_user_id: { type: 'string' },
                  },
                  required: ['file'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Parsed import preview',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ImportPreview' },
                },
              },
            },
            400: {
              description: 'Import failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/imports/{id}': {
        get: {
          tags: ['v1'],
          summary: 'Get an import record',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Import record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ImportRecord' },
                },
              },
            },
            404: {
              description: 'Import record not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/specimens': {
        get: {
          tags: ['v1'],
          summary: 'List specimens in the local nursery',
          parameters: [
            { name: 'ownership_state', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'discord_user_id', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Specimen list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      specimens: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Specimen' },
                      },
                      total: { type: 'integer' },
                    },
                    required: ['specimens', 'total'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/specimens/{id}': {
        get: {
          tags: ['v1'],
          summary: 'Get a single specimen',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Specimen',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Specimen' },
                },
              },
            },
            404: {
              description: 'Specimen not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/specimens/{id}/claim': {
        post: {
          tags: ['v1'],
          summary: 'Claim an imported specimen',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    discord_user_id: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Claimed specimen',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Specimen' },
                },
              },
            },
          },
        },
      },
      '/api/v1/lineages/{id}': {
        get: {
          tags: ['v1'],
          summary: 'Get a specimen lineage tree',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Lineage tree',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LineageTree' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/eligibility': {
        get: {
          tags: ['v1'],
          summary: 'Check pair breeding eligibility in the /api/v1 specimen domain',
          parameters: [
            { name: 'parentA', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'parentB', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Eligibility result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EligibilityResult' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/runs': {
        post: {
          tags: ['v1'],
          summary: 'Run breeding for two /api/v1 specimens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parentA: { type: 'string' },
                    parentB: { type: 'string' },
                    prompt: { type: 'string' },
                  },
                  required: ['parentA', 'parentB'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Breeding result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingRunResult' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/runs/{id}': {
        get: {
          tags: ['v1'],
          summary: 'Get a stored /api/v1 breeding run',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Breeding run record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingRunRecord' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/runs/{id}/save': {
        post: {
          tags: ['v1'],
          summary: 'Mark a breeding run as saved',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Saved breeding run record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingRunRecord' },
                },
              },
            },
          },
        },
      },
      '/api/v1/discord/intents': {
        post: {
          tags: ['v1'],
          summary: 'Create a breeding intent from web/Discord input',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    source_message: { type: 'string' },
                    requester_identity: { type: 'string' },
                    target_specimen_ids: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    source_surface: { type: 'string' },
                  },
                  required: ['source_message'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Breeding intent created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingIntent' },
                },
              },
            },
          },
        },
      },
      '/api/v1/discord/intents/{id}': {
        get: {
          tags: ['v1'],
          summary: 'Get a breeding intent',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Breeding intent',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingIntent' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/proposals': {
        post: {
          tags: ['v1'],
          summary: 'Create a breeding proposal / consent request',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parentAId: { type: 'string' },
                    parentBId: { type: 'string' },
                    requesterId: { type: 'string' },
                    intentId: { type: 'string' },
                  },
                  required: ['parentAId', 'parentBId'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Proposal created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingProposal' },
                },
              },
            },
          },
        },
      },
      '/api/v1/breeding/proposals/{id}/consent': {
        post: {
          tags: ['v1'],
          summary: 'Approve or reject a breeding proposal',
          security: [{ cookieSession: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['approved', 'rejected'] },
                  },
                  required: ['status'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Updated proposal',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BreedingProposal' },
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
        post: {
          tags: ['mock-commerce'],
          summary: 'Create a mock marketplace listing for an owned specimen',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    specimenId: { type: 'string' },
                    price: {
                      type: 'object',
                      properties: {
                        amount: { type: 'number' },
                        currency: { type: 'string' },
                      },
                      required: ['amount'],
                    },
                  },
                  required: ['specimenId', 'price'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Mock listing created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockListingSnapshot' },
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
        patch: {
          tags: ['mock-commerce'],
          summary: 'Update a mock listing price',
          parameters: [
            {
              name: 'slug',
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
                    price: {
                      type: 'object',
                      properties: {
                        amount: { type: 'number' },
                        currency: { type: 'string' },
                      },
                      required: ['amount'],
                    },
                  },
                  required: ['price'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Updated mock listing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockListingSnapshot' },
                },
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
      '/api/me': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get the current mock-commerce identity/session payload',
          responses: {
            200: {
              description: 'Mock current user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockMe' },
                },
              },
            },
          },
        },
      },
      '/api/me/summary': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get the current mock-commerce portfolio summary',
          responses: {
            200: {
              description: 'Mock portfolio summary',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockMe' },
                },
              },
            },
          },
        },
      },
      '/api/my/claws': {
        get: {
          tags: ['mock-commerce'],
          summary: 'List owned mock-commerce specimens',
          parameters: [
            { name: 'inventoryState', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'breedable', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'sourceKind', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock inventory response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockInventoryResponse' },
                },
              },
            },
          },
        },
      },
      '/api/my/claws/{specimenId}': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get mock specimen detail',
          parameters: [
            { name: 'specimenId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock specimen detail',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockInventoryResponse' },
                },
              },
            },
          },
        },
      },
      '/api/my/claws/{specimenId}/activity': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get mock activity for one specimen',
          parameters: [
            { name: 'specimenId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock specimen activity list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
        },
      },
      '/api/my/transactions': {
        get: {
          tags: ['mock-commerce'],
          summary: 'List mock-commerce transaction events',
          responses: {
            200: {
              description: 'Mock transaction feed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockTransactionsResponse' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/mock-listings': {
        get: {
          tags: ['mock-commerce'],
          summary: 'List public mock-commerce listings',
          responses: {
            200: {
              description: 'Public mock listings',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MockListingSnapshot' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}/delist': {
        post: {
          tags: ['mock-commerce'],
          summary: 'Delist a mock-commerce listing',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Delisted mock listing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockListingSnapshot' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}/relist': {
        post: {
          tags: ['mock-commerce'],
          summary: 'Relist a mock-commerce listing',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Relisted mock listing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockListingSnapshot' },
                },
              },
            },
          },
        },
      },
      '/api/marketplace/listings/{slug}/purchase': {
        post: {
          tags: ['mock-commerce'],
          summary: 'Purchase a mock-commerce listing',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock purchase completed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockPurchaseResponse' },
                },
              },
            },
          },
        },
      },
      '/api/breeding/eligibility': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get mock breeding eligibility for one owned specimen',
          parameters: [
            { name: 'specimenId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock breeding eligibility',
              content: {
                'application/json': {
                  schema: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      },
      '/api/breeding/runs': {
        post: {
          tags: ['mock-commerce'],
          summary: 'Run mock breeding for owned specimens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parentASpecimenId: { type: 'string' },
                    parentBSpecimenId: { type: 'string' },
                    preferredTraitId: { type: 'string' },
                    breedPrompt: { type: 'string' },
                  },
                  required: ['parentASpecimenId', 'parentBSpecimenId'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Mock breeding result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockBreedRunResponse' },
                },
              },
            },
          },
        },
      },
      '/api/claws/{clawId}/provenance': {
        get: {
          tags: ['mock-commerce'],
          summary: 'Get mock provenance history for a claw',
          parameters: [
            { name: 'clawId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Mock provenance history',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MockProvenanceResponse' },
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
      :root {
        color-scheme: dark;
        --bg: #0d1a12;
        --panel: #132118;
        --panel-2: #0b130e;
        --text: #f5f0e1;
        --muted: #c8bfa5;
        --line: rgba(212, 165, 55, 0.18);
        --accent: #d4a537;
        --green: #5a8a4a;
      }
      html, body { margin: 0; padding: 0; min-height: 100%; background: var(--bg); color: var(--text); }
      body { font-family: Inter, system-ui, sans-serif; }
      .topbar {
        padding: 14px 18px;
        background: #060e09;
        border-bottom: 1px solid var(--line);
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        align-items: center;
      }
      .topbar a { color: var(--accent); text-decoration: none; }
      .shell { max-width: 1100px; margin: 0 auto; padding: 20px; }
      .hero { margin-bottom: 20px; }
      .hero h1 { margin: 0 0 8px; font-size: 30px; }
      .hero p { margin: 0; color: var(--muted); line-height: 1.5; }
      .status {
        margin-top: 16px;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel-2);
        color: var(--muted);
      }
      .tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(212, 165, 55, 0.08);
        color: var(--accent);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .path-card {
        margin-top: 16px;
        border: 1px solid var(--line);
        border-radius: 12px;
        overflow: hidden;
        background: var(--panel);
      }
      .path-head {
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        background: rgba(0, 0, 0, 0.15);
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .path-url {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 14px;
      }
      .operation { padding: 16px; border-top: 1px solid rgba(255,255,255,0.04); }
      .operation:first-child { border-top: 0; }
      .method {
        display: inline-block;
        min-width: 64px;
        text-align: center;
        font-weight: 700;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-right: 10px;
      }
      .method-get { background: rgba(90,138,74,0.18); color: #9fe28b; }
      .method-post { background: rgba(212,165,55,0.18); color: #ffd979; }
      .method-patch { background: rgba(102,160,255,0.18); color: #9cc2ff; }
      h2, h3, h4 { margin: 0; }
      .summary { font-size: 18px; font-weight: 700; }
      .desc { margin-top: 10px; color: var(--muted); line-height: 1.5; }
      .section { margin-top: 14px; }
      .section h4 { margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
      ul { margin: 0; padding-left: 18px; }
      li { margin: 4px 0; color: var(--muted); }
      pre {
        margin: 0;
        padding: 12px;
        border-radius: 10px;
        background: #08100b;
        border: 1px solid rgba(255,255,255,0.05);
        color: #d6f5db;
        overflow-x: auto;
        font-size: 12px;
      }
      .error {
        margin-top: 14px;
        color: #ffb0b0;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div class="topbar">
      <strong>ClawPark API Docs</strong>
      <span style="margin-left: 12px; opacity: 0.8;">OpenAPI / Swagger-style docs</span>
      <span style="margin-left: 12px;"><a href="${specPath}">Raw OpenAPI JSON</a></span>
    </div>
    <main class="shell">
      <section class="hero">
        <span class="tag">Live Docs</span>
        <h1 id="title">Loading API spec…</h1>
        <p id="description">Fetching OpenAPI from <code>${specPath}</code>.</p>
        <div id="status" class="status">Loading OpenAPI document…</div>
        <div id="error" class="error" hidden></div>
      </section>
      <section id="paths"></section>
    </main>
    <script>
      const specUrl = ${JSON.stringify(specPath)};
      const titleEl = document.getElementById('title');
      const descEl = document.getElementById('description');
      const statusEl = document.getElementById('status');
      const errorEl = document.getElementById('error');
      const pathsEl = document.getElementById('paths');

      function jsonBlock(value) {
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(value, null, 2);
        return pre;
      }

      function renderOperation(path, method, operation) {
        const wrap = document.createElement('div');
        wrap.className = 'operation';

        const header = document.createElement('div');
        const methodEl = document.createElement('span');
        methodEl.className = 'method method-' + method.toLowerCase();
        methodEl.textContent = method;
        header.appendChild(methodEl);

        const summaryEl = document.createElement('span');
        summaryEl.className = 'summary';
        summaryEl.textContent = operation.summary || path;
        header.appendChild(summaryEl);
        wrap.appendChild(header);

        if (operation.description) {
          const desc = document.createElement('div');
          desc.className = 'desc';
          desc.textContent = operation.description;
          wrap.appendChild(desc);
        }

        const meta = [];
        if (operation.security && operation.security.length) meta.push('Requires session/auth for some flows');
        if (Array.isArray(operation.parameters) && operation.parameters.length) {
          meta.push('Parameters: ' + operation.parameters.map((p) => p.name + ' (' + p.in + ')').join(', '));
        }
        if (operation.requestBody) {
          const contentTypes = Object.keys(operation.requestBody.content || {});
          if (contentTypes.length) meta.push('Request body: ' + contentTypes.join(', '));
        }
        if (meta.length) {
          const metaSection = document.createElement('div');
          metaSection.className = 'section';
          const h = document.createElement('h4');
          h.textContent = 'Request';
          metaSection.appendChild(h);
          const ul = document.createElement('ul');
          meta.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
          metaSection.appendChild(ul);
          wrap.appendChild(metaSection);
        }

        if (operation.responses) {
          const responseSection = document.createElement('div');
          responseSection.className = 'section';
          const h = document.createElement('h4');
          h.textContent = 'Responses';
          responseSection.appendChild(h);
          const ul = document.createElement('ul');
          Object.entries(operation.responses).forEach(([code, response]) => {
            const li = document.createElement('li');
            li.textContent = code + ' — ' + ((response && response.description) || 'Response');
            ul.appendChild(li);
          });
          responseSection.appendChild(ul);
          wrap.appendChild(responseSection);
        }

        return wrap;
      }

      function renderSpec(spec) {
        titleEl.textContent = spec.info?.title || 'ClawPark API Docs';
        descEl.textContent = spec.info?.description || 'OpenAPI document loaded successfully.';
        statusEl.textContent = 'Loaded OpenAPI ' + (spec.openapi || 'unknown') + ' with ' + Object.keys(spec.paths || {}).length + ' route groups.';

        Object.entries(spec.paths || {}).forEach(([path, methods]) => {
          const card = document.createElement('article');
          card.className = 'path-card';

          const head = document.createElement('div');
          head.className = 'path-head';
          const pathEl = document.createElement('div');
          pathEl.className = 'path-url';
          pathEl.textContent = path;
          head.appendChild(pathEl);
          card.appendChild(head);

          Object.entries(methods || {}).forEach(([method, operation]) => {
            card.appendChild(renderOperation(path, method.toUpperCase(), operation || {}));
          });

          pathsEl.appendChild(card);
        });

        const rawSection = document.createElement('section');
        rawSection.className = 'section';
        const rawHeading = document.createElement('h4');
        rawHeading.textContent = 'Spec Preview';
        rawSection.appendChild(rawHeading);
        rawSection.appendChild(jsonBlock({
          openapi: spec.openapi,
          info: spec.info,
          servers: spec.servers,
        }));
        pathsEl.appendChild(rawSection);
      }

      fetch(specUrl)
        .then(async (response) => {
          if (!response.ok) throw new Error('Failed to load OpenAPI JSON (' + response.status + ')');
          return response.json();
        })
        .then(renderSpec)
        .catch((error) => {
          statusEl.textContent = 'Failed to load OpenAPI document.';
          errorEl.hidden = false;
          errorEl.textContent = String(error);
        });
    </script>
  </body>
</html>`;
}
