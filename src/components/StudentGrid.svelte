<script>
  export let filteredRoster = [];
</script>

<div class="grid">
  {#each filteredRoster as student}
    <div class="card">
      <img
        src={student.imageBlob || student.imageLink}
        alt="{student.First} {student.Last}"
      />
      <div class="overlay">
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
              <div class="github-profile">
                <div><strong>{student.githubProfile.name || student.githubProfile.login}</strong></div>
                {#if student.githubProfile.bio}
                  <div class="bio">{student.githubProfile.bio}</div>
                {/if}
                <div class="stats">
                  <span><i class="repo-icon"></i>{student.githubProfile.public_repos} repos</span>
                  <span><i class="followers-icon"></i>{student.githubProfile.followers} followers</span>
                </div>
                {#if student.githubProfile.location}
                  <div><i class="location-icon"></i>{student.githubProfile.location}</div>
                {/if}
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
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .card {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    background: #fff;
    transition: transform 0.2s;
  }
  .card:hover {
    transform: scale(1.02);
  }
  .card img {
    width: 100%;
    display: block;
  }
  .overlay {
    position: absolute;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    width: 100%;
    padding: 0.5rem;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    font-size: 0.9rem;
  }
  .card:hover .overlay {
    transform: translateY(0);
  }
  .overlay a {
    color: #80bdff;
    text-decoration: none;
  }
  .github-profile {
    margin-top: 5px;
    padding: 5px;
    background: rgba(40, 40, 40, 0.7);
    border-radius: 4px;
    font-size: 0.8rem;
  }
  .github-profile .bio {
    margin: 3px 0;
    font-style: italic;
    opacity: 0.9;
  }
  .github-profile .stats {
    display: flex;
    justify-content: space-between;
    margin: 3px 0;
  }
  .github-profile .stats span {
    display: flex;
    align-items: center;
  }
  .repo-icon::before {
    content: '📦';
    margin-right: 3px;
  }
  .followers-icon::before {
    content: '👥';
    margin-right: 3px;
  }
  .location-icon::before {
    content: '📍';
    margin-right: 3px;
  }
</style>
