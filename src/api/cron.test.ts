import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CronAPI } from './cron';
import type { CronJob, CronRunLogEntry } from '../protocol/api-common.js';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('CronAPI', () => {
  let api: CronAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as unknown as RequestFn;
    api = new CronAPI(mockRequest as unknown as RequestFn);
  });

  describe('list', () => {
    it('lists cron jobs without params', async () => {
      const jobs: CronJob[] = [{ id: 'job-1', cron: '0 * * * *', prompt: 'Check status' }];
      mockRequest.mockResolvedValue({ jobs });

      const result = await api.list();

      expect(mockRequest).toHaveBeenCalledWith('cron.list', undefined);
      expect(result).toEqual({ jobs });
    });

    it('lists cron jobs with params', async () => {
      const jobs: CronJob[] = [{ id: 'job-2', cron: '*/5 * * * *', prompt: 'Poll' }];
      mockRequest.mockResolvedValue({ jobs });

      // CronListParams is empty - list() takes no params
      const result = await api.list();

      expect(mockRequest).toHaveBeenCalledWith('cron.list', undefined);
      expect(result).toEqual({ jobs });
    });
  });

  describe('add', () => {
    it('adds a cron job', async () => {
      const job: CronJob = { id: 'job-new', cron: '0 9 * * *', prompt: 'Morning report' };
      mockRequest.mockResolvedValue(job);

      const result = await api.add({ cron: '0 9 * * *', prompt: 'Morning report' });

      expect(mockRequest).toHaveBeenCalledWith('cron.add', { cron: '0 9 * * *', prompt: 'Morning report' });
      expect(result).toEqual(job);
    });
  });

  describe('status', () => {
    it('gets cron job status', async () => {
      const job: CronJob = { id: 'job-1', cron: '0 * * * *', prompt: 'Check status' };
      mockRequest.mockResolvedValue(job);

      const result = await api.status({ jobId: 'job-1' });

      expect(mockRequest).toHaveBeenCalledWith('cron.status', { jobId: 'job-1' });
      expect(result).toEqual(job);
    });
  });

  describe('remove', () => {
    it('removes a cron job', async () => {
      mockRequest.mockResolvedValue(undefined);

      await api.remove({ jobId: 'job-1' });

      expect(mockRequest).toHaveBeenCalledWith('cron.remove', { jobId: 'job-1' });
    });
  });

  describe('run', () => {
    it('manually triggers a cron job', async () => {
      mockRequest.mockResolvedValue(undefined);

      await api.run({ jobId: 'job-1' });

      expect(mockRequest).toHaveBeenCalledWith('cron.run', { jobId: 'job-1' });
    });
  });

  describe('update', () => {
    it('updates a cron job', async () => {
      const job: CronJob = { id: 'job-1', cron: '*/10 * * * *', prompt: 'Updated prompt' };
      mockRequest.mockResolvedValue(job);

      const result = await api.update({ jobId: 'job-1', cron: '*/10 * * * *', prompt: 'Updated prompt' });

      expect(mockRequest).toHaveBeenCalledWith('cron.update', { jobId: 'job-1', cron: '*/10 * * * *', prompt: 'Updated prompt' });
      expect(result).toEqual(job);
    });
  });

  describe('runs', () => {
    it('gets run history without params', async () => {
      const runs: CronRunLogEntry[] = [{ id: 'run-1', jobId: 'job-1', timestamp: 1234567890, success: true }];
      mockRequest.mockResolvedValue({ runs });

      const result = await api.runs();

      expect(mockRequest).toHaveBeenCalledWith('cron.runs', undefined);
      expect(result).toEqual({ runs });
    });

    it('gets run history with params', async () => {
      const runs: CronRunLogEntry[] = [];
      mockRequest.mockResolvedValue({ runs });

      // CronRunsParams is empty, so no params
      const result = await api.runs();

      expect(mockRequest).toHaveBeenCalledWith('cron.runs', undefined);
      expect(result).toEqual({ runs });
    });
  });
});
