import { Octokit } from '@octokit/rest';

interface ReviewComment {
  suggestion: string;
  reason: string;
}

interface ReviewFeedback {
  [lineNumber: string]: ReviewComment;
}

const REVIEW_PROMPT = `Act as a senior software engineer with deep expertise in TypeScript, Node.js, and GitHub Actions. Review the following code changes and provide detailed feedback.

Focus on these critical aspects:
1. Security vulnerabilities and best practices
2. Performance implications and optimizations
3. Code maintainability and readability
4. Potential edge cases and error handling
5. TypeScript type safety and proper typing
6. GitHub Actions specific concerns and best practices

Format your response as a JSON object where:
- Keys are line numbers
- Values are objects containing:
  - "suggestion": Clear, actionable improvement suggestion
  - "reason": Detailed explanation of why this change is important

Only include substantive feedback that would meaningfully improve the code. Avoid trivial stylistic comments.

Code to review:
\`\`\`typescript
{code}
\`\`\``;

export async function reviewPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  openAIKey: string
): Promise<void> {
  try {
    // Get the PR diff
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    for (const file of files) {
      if (!file.filename.endsWith('.ts') && !file.filename.endsWith('.tsx')) {
        continue; // Only review TypeScript files
      }

      try {
        // Get the file content
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: file.sha,
        });

        // Handle the response which can be a single file or an array
        if (Array.isArray(data) || !('content' in data)) {
          console.log(`Skipping ${file.filename}: Not a single file or no content available`);
          continue;
        }

        // Prepare the content for review
        const fileContent = Buffer.from(data.content, 'base64').toString();
        
        // Call OpenAI API for review
        const review = await reviewCode(fileContent, openAIKey);

        // Post comments for each suggestion
        for (const [line, comment] of Object.entries(review)) {
          await octokit.rest.pulls.createReviewComment({
            owner,
            repo,
            pull_number: pullNumber,
            body: `📝 **Suggestion**: ${comment.suggestion}\n\n💡 **Reason**: ${comment.reason}`,
            commit_id: file.sha,
            path: file.filename,
            line: parseInt(line),
          });
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.filename}:`, fileError);
        continue; // Skip this file but continue with others
      }
    }

    // Add a summary comment
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: `## 🤖 Code Review Complete\n\nI've reviewed the TypeScript files in this PR and provided inline comments where I found potential improvements. The review focused on:\n\n- 🔒 Security best practices\n- ⚡ Performance optimizations\n- 📚 Code maintainability\n- 🎯 Error handling\n- 📐 Type safety\n- 🔄 GitHub Actions specifics\n\nPlease review the inline comments and let me know if you have any questions!`
    });

  } catch (error) {
    console.error('Error during code review:', error);
    throw error;
  }
}

async function reviewCode(code: string, apiKey: string): Promise<ReviewFeedback> {
  const prompt = REVIEW_PROMPT.replace('{code}', code);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer specialized in TypeScript and GitHub Actions. Provide clear, actionable feedback focused on security, performance, and best practices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more focused responses
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error('Failed to parse review response:', e);
    return {};
  }
} 