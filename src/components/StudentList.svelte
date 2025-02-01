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
</style>
