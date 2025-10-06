import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { SecurityToolsService } from './services/SecurityToolsService';
import { DataIngestionService } from './services/DataIngestionService';

export async function createRouter({
  httpAuth,
  securityToolsService,
  dataIngestionService,
}: {
  httpAuth: HttpAuthService;
  securityToolsService: SecurityToolsService;
  dataIngestionService: DataIngestionService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const createSecurityToolSchema = z.object({
    repository_name: z.string(),
    programming_languages: z.string().nullable().optional(),
    tool_category: z.string(),
    tool_name: z.string(),
    is_required: z.boolean().optional(),
    implemented: z.boolean().optional(),
    info_url: z.string().nullable().optional(),
  });

  const updateSecurityToolSchema = z.object({
    programming_languages: z.string().nullable().optional(),
    tool_category: z.string().optional(),
    tool_name: z.string().optional(),
    is_required: z.boolean().optional(),
    implemented: z.boolean().optional(),
    info_url: z.string().nullable().optional(),
  });

  const bulkUpsertSecurityToolsSchema = z.array(createSecurityToolSchema);

  // Create a new security tool
  router.post('/security-tools', async (req, res) => {
    const parsed = createSecurityToolSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await securityToolsService.createSecurityTool(parsed.data);

    res.status(201).json(result);
  });

  // Bulk upsert security tools
  router.post('/security-tools/bulk-upsert', async (req, res) => {
    const parsed = bulkUpsertSecurityToolsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await securityToolsService.bulkUpsertSecurityTools(
      parsed.data,
    );

    res.status(200).json(result);
  });

  // List all security tools
  router.get('/security-tools', async (_req, res) => {
    res.json(await securityToolsService.listSecurityTools());
  });

  // Get a specific security tool by repository name
  router.get('/security-tools/:repositoryName', async (req, res) => {
    res.json(
      await securityToolsService.getSecurityTool({
        repositoryName: req.params.repositoryName,
      }),
    );
  });

  // Update a security tool
  router.put('/security-tools/:repositoryName', async (req, res) => {
    const parsed = updateSecurityToolSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await securityToolsService.updateSecurityTool(
      req.params.repositoryName,
      parsed.data,
    );

    res.json(result);
  });

  // Delete a security tool
  router.delete('/security-tools/:repositoryName', async (req, res) => {
    await securityToolsService.deleteSecurityTool({
      repositoryName: req.params.repositoryName,
    });

    res.status(204).send();
  });

  // Fetch and save all GitHub security data
  router.post('/data-ingestion/github/all', async (_req, res) => {
    await dataIngestionService.fetchAndSaveAllGitHubSecurityData();
    res.status(200).json({ message: 'Successfully fetched and saved all GitHub security data' });
  });

  // Fetch and save latest updated GitHub security data
  router.post('/data-ingestion/github/latest', async (req, res) => {
    const limit = req.body.limit;
    await dataIngestionService.fetchAndSaveLatestUpdatedGitHubSecurityData(limit);
    res.status(200).json({ message: `Successfully fetched and saved latest updated repositories` });
  });

  return router;
}
