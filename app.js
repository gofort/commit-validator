const { Probot } = require("probot");

module.exports = (app) => {
  app.on("push", async (context) => {
    const { commits } = context.payload;

    const invalidCommits = commits.filter((commit) => {
      const message = commit.message;
      // Regex to enforce the format: [Jira Ticket] <type: e.g. fix> <description>
      const regex = /^\[([A-Z]+-\d+)]\s\w+:\s.+$/;
      return !regex.test(message);
    });

    if (invalidCommits.length > 0) {
      const commitMessages = invalidCommits.map((commit) => `- ${commit.message}`).join("\n");

      // Comment on the push or notify the pusher
      const repo = context.payload.repository;
      const pusher = context.payload.pusher;

      context.log.info(
        `Invalid commit messages detected for ${repo.full_name} pushed by ${pusher.name}.`
      );

      await context.octokit.repos.createCommitComment({
        owner: repo.owner.login,
        repo: repo.name,
        commit_sha: invalidCommits[0].id,
        body: `Invalid commit messages detected:\n\n${commitMessages}\n\nCommit messages must follow the format: \`[Jira Ticket] <type: e.g. fix> <description>\`.`
      });
    }
  });
};
