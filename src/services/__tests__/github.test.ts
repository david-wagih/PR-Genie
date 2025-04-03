import { GitHubService } from '../github';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        pulls: {
          get: jest.fn(),
          listFiles: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<Octokit>;
    githubService = new GitHubService(mockOctokit);
  });

  it('should fetch pull request details', async () => {
    (mockOctokit.rest.pulls.get as unknown as jest.Mock).mockResolvedValue({ data: { id: 123 } } as any);
    const result = await githubService.getPullRequest({ owner: 'owner', repo: 'repo', pullNumber: 1 });
    expect(result.data.id).toBe(123);
    expect(mockOctokit.rest.pulls.get).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1,
    });
  });

  it('should fetch pull request files', async () => {
    (mockOctokit.rest.pulls.listFiles as unknown as jest.Mock).mockResolvedValue({ data: [{ filename: 'file1.ts' }] } as any);
    const result = await githubService.getPullRequestFiles({ owner: 'owner', repo: 'repo', pullNumber: 1 });
    expect(result.data[0].filename).toBe('file1.ts');
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1,
    });
  });

  it('should create a comment on a pull request', async () => {
    (mockOctokit.rest.issues.createComment as unknown as jest.Mock).mockResolvedValue({ data: { id: 456 } } as any);
    const result = await githubService.createComment(
      { owner: 'owner', repo: 'repo', pullNumber: 1 },
      'Test comment'
    );
    expect(result.data.id).toBe(456);
    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: 'Test comment',
    });
  });
});
