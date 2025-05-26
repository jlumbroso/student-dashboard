<script>
  export let filteredRoster = [];
</script>

<div class="list">
  {#each filteredRoster as student}
    <div class="student-row">
      <img
        src={student.imageBlob || student.imageLink}
        alt="{student.First} {student.Last}"
      />
      <div class="student-details">
        <div><strong>{student.First} {student.Last}</strong></div>
        <div>{student.EmailAddress}</div>
        <div>
          Major: {student["Primary Major Title"] || student["Primary Major"]}
        </div>
        <div>Class: {student.Classification}</div>
        {#if student.githubUsername}
          <div>
            GitHub: <a
              href={"https://github.com/" + student.githubUsername}
              target="_blank"
              rel="noopener">@{student.githubUsername}</a
            >
            {#if student.githubProfile}
              <div class="github-profile-info">
                {#if student.githubProfile.name}
                  <div><strong>{student.githubProfile.name}</strong></div>
                {/if}
                {#if student.githubProfile.bio}
                  <div>{student.githubProfile.bio}</div>
                {/if}
                <div class="github-stats">
                  <span>{student.githubProfile.public_repos} repos</span>
                  <span>{student.githubProfile.followers} followers</span>
                  {#if student.githubProfile.location}
                    <span>{student.githubProfile.location}</span>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div>GitHub: N/A</div>
        {/if}
        {#if student.slackUserId}
          <div>
            Slack: <a
              href={"https://penn-cis-3500.slack.com/team/" +
                student.slackUserId}
              target="_blank"
              rel="noopener"
            >
              {student.slackDisplayname ||
                student.slackFullname ||
                student.First}
            </a>
          </div>
        {:else}
          <div>Slack: N/A</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .student-row {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
  }
  .student-row img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
    margin-right: 1rem;
  }
  .student-details {
    flex: 1;
  }
  .student-details div {
    margin-bottom: 0.25rem;
  }
  .student-details a {
    color: #007acc;
    text-decoration: none;
  }
  .github-profile-info {
    margin-top: 0.25rem;
    margin-left: 1rem;
    padding: 0.5rem;
    background-color: #f8f8f8;
    border-left: 3px solid #0366d6;
    border-radius: 3px;
    font-size: 0.9rem;
  }
  .github-stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
  }
</style>
