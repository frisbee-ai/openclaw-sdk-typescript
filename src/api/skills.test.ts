import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillsAPI } from './skills';
import type { SkillsBinsResult, ToolsCatalogResult, ToolsEffectiveResult } from '../protocol/params/skills.js';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('SkillsAPI', () => {
  let api: SkillsAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as unknown as RequestFn;
    api = new SkillsAPI(mockRequest as unknown as RequestFn);
  });

  describe('status', () => {
    it('gets skill status without params', async () => {
      const status = { installed: ['skill-a', 'skill-b'] };
      mockRequest.mockResolvedValue(status);

      const result = await api.status();

      expect(mockRequest).toHaveBeenCalledWith('skills.status', undefined);
      expect(result).toEqual(status);
    });

    it('gets skill status with params', async () => {
      const status = { installed: ['skill-a'] };
      mockRequest.mockResolvedValue(status);

      const result = await api.status({ nodeId: 'node-1' });

      expect(mockRequest).toHaveBeenCalledWith('skills.status', { nodeId: 'node-1' });
      expect(result).toEqual(status);
    });
  });

  describe('install', () => {
    it('installs a skill', async () => {
      mockRequest.mockResolvedValue(undefined);

      await api.install({ name: 'my-skill', version: '1.0.0' });

      expect(mockRequest).toHaveBeenCalledWith('skills.install', { name: 'my-skill', version: '1.0.0' });
    });
  });

  describe('update', () => {
    it('updates a skill', async () => {
      mockRequest.mockResolvedValue(undefined);

      await api.update({ name: 'my-skill', version: '2.0.0' });

      expect(mockRequest).toHaveBeenCalledWith('skills.update', { name: 'my-skill', version: '2.0.0' });
    });
  });

  describe('bins', () => {
    it('gets skills bins without params', async () => {
      const bins: SkillsBinsResult = { bins: ['bin-a', 'bin-b'] };
      mockRequest.mockResolvedValue(bins);

      const result = await api.bins();

      expect(mockRequest).toHaveBeenCalledWith('skills.bins', undefined);
      expect(result).toEqual(bins);
    });

    it('gets skills bins with params', async () => {
      const bins: SkillsBinsResult = { bins: ['bin-a'] };
      mockRequest.mockResolvedValue(bins);

      const result = await api.bins({ nodeId: 'node-1' });

      expect(mockRequest).toHaveBeenCalledWith('skills.bins', { nodeId: 'node-1' });
      expect(result).toEqual(bins);
    });
  });

  describe('tools', () => {
    describe('catalog', () => {
      it('gets tools catalog without params', async () => {
        const catalog: ToolsCatalogResult = { tools: [{ name: 'tool-1', description: 'A tool' }] };
        mockRequest.mockResolvedValue(catalog);

        const result = await api.tools.catalog();

        expect(mockRequest).toHaveBeenCalledWith('tools.catalog', undefined);
        expect(result).toEqual(catalog);
      });

      it('gets tools catalog with params', async () => {
        const catalog: ToolsCatalogResult = { tools: [] };
        mockRequest.mockResolvedValue(catalog);

        const result = await api.tools.catalog({ skill: 'my-skill' });

        expect(mockRequest).toHaveBeenCalledWith('tools.catalog', { skill: 'my-skill' });
        expect(result).toEqual(catalog);
      });
    });

    describe('effective', () => {
      it('gets effective tools without params', async () => {
        const effective: ToolsEffectiveResult = { tools: ['tool-1', 'tool-2'] };
        mockRequest.mockResolvedValue(effective);

        const result = await api.tools.effective();

        expect(mockRequest).toHaveBeenCalledWith('tools.effective', undefined);
        expect(result).toEqual(effective);
      });

      it('gets effective tools with params', async () => {
        const effective: ToolsEffectiveResult = { tools: ['tool-1'] };
        mockRequest.mockResolvedValue(effective);

        const result = await api.tools.effective({ nodeId: 'node-1', skill: 'my-skill' });

        expect(mockRequest).toHaveBeenCalledWith('tools.effective', { nodeId: 'node-1', skill: 'my-skill' });
        expect(result).toEqual(effective);
      });
    });
  });
});
