import * as core from '@actions/core';
import * as github from '@actions/github';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

type PullRequestFile = RestEndpointMethodTypes['pulls']['listFiles']['response']['data'][0];

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const prNumber = parseInt(core.getInput('pr-number', { required: true }));

    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Get PR details
    const { data: pr } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
    });

    // Get PR files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
    });

    // Calculate statistics
    const totalFiles = files.length;
    const additions = files.reduce((sum: number, file: PullRequestFile) => sum + file.additions, 0);
    const deletions = files.reduce((sum: number, file: PullRequestFile) => sum + file.deletions, 0);
    const changes = additions + deletions;

    // Generate summary
    const summary = [
      '## 📊 Pull Request Analysis',
      '',
      `### Overview`,
      `- 📁 Files changed: ${totalFiles}`,
      `- ✨ Lines added: ${additions}`,
      `- 🗑️ Lines removed: ${deletions}`,
      `- 📈 Total changes: ${changes}`,
      '',
      '### Files Changed',
      ...files.map((file: PullRequestFile) => `- \`${file.filename}\` (+${file.additions}/-${file.deletions})`),
    ].join('\n');

    // Post comment on PR
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: summary,
    });

    core.setOutput('total_files', totalFiles);
    core.setOutput('additions', additions);
    core.setOutput('deletions', deletions);
    core.setOutput('total_changes', changes);

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run(); 