<script>
  export let filteredRoster = [];
  
  // Format message text to handle emojis and basic formatting
  function formatMessageText(text) {
    if (!text) return '';
    
    // First replace links, before other formatting
    // Replace <https://...> links with actual links
    text = text.replace(/<(https?:\/\/[^\|>]+)(?:\|([^>]+))?>/g, (match, url, label) => {
      return `<a href="${url}" target="_blank" rel="noopener" class="message-link">${label || url}</a>`;
    });
    
    // Also convert regular URLs that aren't in brackets
    text = text.replace(/(?<!\")(https?:\/\/[^\s]+)(?!\")/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener" class="message-link">${url}</a>`;
    });
    
    // Replace basic Slack-style formatting
    text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>'); // Bold
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>'); // Italic
    text = text.replace(/~([^~]+)~/g, '<del>$1</del>'); // Strikethrough
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>'); // Code
    
    // More comprehensive emoji map with commonly used emoji in the messages
    const emojiMap = {
      // Faces
      ':smile:': '😊',
      ':laughing:': '😄',
      ':blush:': '😊',
      ':smiley:': '😃',
      ':relaxed:': '☺️',
      ':smirk:': '😏',
      ':grinning:': '😀',
      ':wink:': '😉',
      ':innocent:': '😇',
      ':sunglasses:': '😎',
      ':star-struck:': '🤩',
      ':thinking:': '🤔',
      ':thinking_face:': '🤔',
      ':slightlysmilingface:': '🙂',
      ':slightly_smiling_face:': '🙂',
      
      // Hand gestures
      ':+1:': '👍',
      ':-1:': '👎',
      ':thumbsup:': '👍',
      ':thumbsdown:': '👎',
      ':wave:': '👋',
      ':clap:': '👏',
      ':ok_hand:': '👌',
      ':pray:': '🙏',
      ':muscle:': '💪',
      ':raised_hands:': '🙌',
      
      // Objects and symbols
      ':heart:': '❤️',
      ':tada:': '🎉',
      ':rocket:': '🚀',
      ':fire:': '🔥',
      ':sparkles:': '✨',
      ':flag-pk:': '🇵🇰',
      ':flag-au:': '🇦🇺',
      ':flag-il:': '🇮🇱',
      ':flag-eg:': '🇪🇬',
      ':squirrel:': '🐿️',
      ':mirrorball:': '🪩',
      
      // Additional emojis mentioned in messages
      ':computer:': '💻',
      ':chart_with_upwards_trend:': '📈',
      ':mortar_board:': '🎓'
    };
    
    // Replace emoji codes
    Object.keys(emojiMap).forEach(code => {
      text = text.replace(new RegExp(code, 'g'), emojiMap[code]);
    });
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }
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
        
        {#if student.messages && student.messages.length > 0}
          <div>
            <div class="messages-header">
              <span>Messages ({student.messages.length})</span>
            </div>
            <div class="messages-container">
              {#each student.messages as message}
                <div class="message-item">
                  <div class="message-meta">
                    <span class="message-date">{new Date(message.date || message.timestamp * 1000).toLocaleDateString()}</span>
                    <span class="message-channel">{message.channel || ''}</span>
                  </div>
                  <div class="message-text">{@html formatMessageText(message.text)}</div>
                </div>
              {/each}
            </div>
          </div>
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
  
  /* Message styles */
  .messages-header {
    margin-top: 0.5rem;
    font-weight: bold;
    color: #333;
  }
  
  .messages-container {
    margin-left: 1rem;
    margin-top: 0.25rem;
    border-left: 3px solid #4caf50;
    padding-left: 0.5rem;
  }
  
  .message-item {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 3px;
    font-size: 0.9rem;
  }
  
  .message-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .message-date {
    font-style: italic;
  }
  
  .message-channel {
    background-color: #eee;
    padding: 0 0.3rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }
  
  .message-text {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
    margin-top: 0.25rem;
  }
  
  /* These classes are used dynamically in the formatMessageText function */
  :global(.message-link) {
    color: #0366d6;
    text-decoration: none;
  }
  
  :global(.message-link:hover) {
    text-decoration: underline;
  }
</style>
