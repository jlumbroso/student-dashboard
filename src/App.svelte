<script>
  import log from "loglevel";
  import { onMount } from "svelte";
  import UploadButtons from "./components/UploadButtons.svelte";
  import FilterBar from "./components/FilterBar.svelte";
  import StudentGrid from "./components/StudentGrid.svelte";
  import StudentList from "./components/StudentList.svelte";
  import { roster, filters } from "./lib/store.js";

  log.setLevel("debug");

  let viewMode = "grid";
  
  // GitHub profile caching
  let cachedGithubProfiles = {};
  let githubProfilesLoaded = 0;
  let githubProfilesTotal = 0;
  let isLoadingGithub = false;
  let githubBatchSize = 20; // Number of profiles to load in each batch

  // Filtering logic.
  $: filteredRoster = $roster.filter((student) => {
    let passes = true;
    // Free-text search: check name or email.
    if ($filters.search && $filters.search.trim() !== "") {
      const searchLower = $filters.search.toLowerCase();
      const fullName = (
        (student.First || "") +
        " " +
        (student.Last || "")
      ).toLowerCase();
      const email = (student.EmailAddress || "").toLowerCase();
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        passes = false;
      }
    }
    // GitHub toggle.
    if ($filters.hasGitHub === "yes" && !student.githubUsername) passes = false;
    if ($filters.hasGitHub === "no" && student.githubUsername) passes = false;
    // Slack toggle.
    if ($filters.hasSlack === "yes" && !student.slackUserId) passes = false;
    if ($filters.hasSlack === "no" && student.slackUserId) passes = false;
    // Major dropdown.
    if ($filters.major && $filters.major !== "all") {
      const majorLower = $filters.major.toLowerCase();
      const studentMajor = (
        student["Primary Major Title"] ||
        student["Primary Major"] ||
        ""
      ).toLowerCase();
      if (!studentMajor.includes(majorLower)) passes = false;
    }
    // Classification dropdown.
    if ($filters.classification && $filters.classification !== "all") {
      if (
        (student.Classification || "").toLowerCase() !==
        $filters.classification.toLowerCase()
      ) {
        passes = false;
      }
    }
    return passes;
  });

  $: log.debug("Filtered roster count:", filteredRoster.length);

  // Initialize GitHub profile cache on component mount
  onMount(() => {
    try {
      const cached = localStorage.getItem('githubProfiles');
      if (cached) {
        cachedGithubProfiles = JSON.parse(cached);
        log.debug(`Loaded ${Object.keys(cachedGithubProfiles).length} cached GitHub profiles`);
      }
    } catch (error) {
      log.error('Error loading cached GitHub profiles:', error);
    }
    
    // Always update counters on mount to ensure UI is correct
    updateGithubCounters();
  });
  
  // Subscribe to roster changes to update GitHub counters
  $: {
    if ($roster) {
      // Update counters whenever roster changes
      updateGithubCounters();
      
      // Apply cached profiles if available
      if (Object.keys(cachedGithubProfiles).length > 0) {
        updateRosterWithCachedProfiles();
      }
    }
  };
  
  // Save GitHub profiles to localStorage
  function saveGithubProfiles() {
    try {
      const profilesJSON = JSON.stringify(cachedGithubProfiles);
      localStorage.setItem('githubProfiles', profilesJSON);
      
      // Log cache size for debugging
      const profileCount = Object.keys(cachedGithubProfiles).length;
      const sizeKB = (profilesJSON.length / 1024).toFixed(1);
      log.debug(`Saved ${profileCount} GitHub profiles (${sizeKB} KB) to localStorage`);
    } catch (error) {
      log.error('Error saving GitHub profiles to localStorage:', error);
      
      // If it's a quota error, show a warning
      if (error.name === 'QuotaExceededError') {
        alert('Warning: Unable to save all GitHub profiles to localStorage. The cache is full.');
      }
    }
  }
  
  // Update roster with any cached GitHub profiles
  function updateRosterWithCachedProfiles() {
    if (Object.keys(cachedGithubProfiles).length === 0) return;
    
    const updatedRoster = [...$roster];
    let updatedCount = 0;
    
    updatedRoster.forEach((student, index) => {
      if (student.githubUsername && cachedGithubProfiles[student.githubUsername]) {
        updatedRoster[index].githubProfile = cachedGithubProfiles[student.githubUsername];
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      roster.set(updatedRoster);
      log.debug(`Applied ${updatedCount} cached GitHub profiles to roster`);
    }
    
    // Update counters
    updateGithubCounters();
  }
  
  // Update GitHub profile counters
  function updateGithubCounters() {
    // Count students with GitHub usernames
    const studentsWithGithub = $roster.filter(student => student.githubUsername);
    githubProfilesTotal = studentsWithGithub.length;
    
    // Count students with GitHub profiles
    githubProfilesLoaded = $roster.filter(
      student => student.githubUsername && student.githubProfile
    ).length;
    
    log.debug(`GitHub profiles: ${githubProfilesLoaded}/${githubProfilesTotal} loaded`);
  }
  
  // Clear all GitHub profiles
  function clearGithubProfiles() {
    if (!confirm('Are you sure you want to clear all cached GitHub profiles?')) {
      return;
    }
    
    // Get cache size before clearing
    const cacheSize = JSON.stringify(cachedGithubProfiles).length;
    const profileCount = Object.keys(cachedGithubProfiles).length;
    
    // Clear the cache
    cachedGithubProfiles = {};
    localStorage.removeItem('githubProfiles');
    
    // Clear profiles from roster
    const updatedRoster = [...$roster];
    updatedRoster.forEach((student, index) => {
      if (student.githubProfile) {
        delete updatedRoster[index].githubProfile;
      }
    });
    
    roster.set(updatedRoster);
    updateGithubCounters();
    
    // Show detailed message about what was cleared
    alert(`Cleared ${profileCount} GitHub profiles (${(cacheSize / 1024).toFixed(1)} KB) from localStorage.`);
  }

  function setView(mode) {
    viewMode = mode;
  }

  function clearRecords() {
    if (confirm("Are you sure you want to clear all records?")) {
      roster.set([]);
    }
  }

  async function copyEmails() {
    const emails = filteredRoster
      .map((student) => student.EmailAddress)
      .filter((email) => email && email.trim() !== "");
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      alert(`Copied ${emails.length} emails to clipboard.`);
    } catch (err) {
      alert("Failed to copy emails: " + err);
    }
  }

  // Load a batch of GitHub profiles
  async function loadMoreGithubProfiles() {
    if (isLoadingGithub) return;
    
    isLoadingGithub = true;
    updateGithubCounters();
    
    try {
      // Get students with GitHub usernames but no profiles yet
      const studentsToLoad = $roster.filter(
        student => student.githubUsername && !student.githubProfile
      );
      
      // Take a batch of students
      const batch = studentsToLoad.slice(0, githubBatchSize);
      
      if (batch.length === 0) {
        alert('No more GitHub profiles to load.');
        isLoadingGithub = false;
        return;
      }
      
      log.debug(`Loading batch of ${batch.length} GitHub profiles`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Create a new roster array so we can update it
      const updatedRoster = [...$roster];
      
      // Process each student in the batch
      for (const student of batch) {
        try {
          const username = student.githubUsername;
          if (!username) continue;
          
          // Check if already cached
          if (cachedGithubProfiles[username]) {
            log.debug(`Using cached profile for ${username}`);
            
            // Find student in the updatedRoster and add the cached profile
            const studentIndex = updatedRoster.findIndex(s => 
              s.studentId === student.studentId);
              
            if (studentIndex !== -1) {
              updatedRoster[studentIndex].githubProfile = cachedGithubProfiles[username];
              successCount++;
            }
            
            continue;
          }
          
          // Not cached, need to fetch
          const response = await fetch(`https://api.github.com/users/${username}`);
          
          if (!response.ok) {
            if (response.status === 403) {
              // Check for rate limit info in headers
              const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
              const rateLimitReset = response.headers.get('X-RateLimit-Reset');
              
              let errorMsg = 'GitHub API rate limit exceeded.';
              
              if (rateLimitReset) {
                // Convert Unix timestamp to readable time
                const resetDate = new Date(rateLimitReset * 1000);
                const resetIn = Math.ceil((resetDate - new Date()) / (1000 * 60)); // minutes
                errorMsg += ` Rate limit will reset in approximately ${resetIn} minute(s).`;
              }
              
              errorMsg += ' Try again later or use a GitHub access token.';
              throw new Error(errorMsg);
            } else {
              throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }
          }
          
          const githubData = await response.json();
          
          // Extract only the fields we want to store
          const githubProfile = {
            login: githubData.login,
            id: githubData.id,
            avatar_url: githubData.avatar_url,
            gravatar_id: githubData.gravatar_id || "",
            url: githubData.url,
            html_url: githubData.html_url,
            name: githubData.name,
            company: githubData.company,
            blog: githubData.blog,
            location: githubData.location,
            bio: githubData.bio,
            twitter_username: githubData.twitter_username,
            public_repos: githubData.public_repos,
            public_gists: githubData.public_gists,
            followers: githubData.followers,
            following: githubData.following,
            created_at: githubData.created_at,
            updated_at: githubData.updated_at
          };
          
          // Cache the profile
          cachedGithubProfiles[username] = githubProfile;
          saveGithubProfiles();
          
          // Find student in the updatedRoster and add/update the githubProfile
          const studentIndex = updatedRoster.findIndex(s => 
            s.studentId === student.studentId);
            
          if (studentIndex !== -1) {
            updatedRoster[studentIndex].githubProfile = githubProfile;
          }
          
          successCount++;
          
          // Add a delay to avoid hitting GitHub API rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          log.error(`Error fetching GitHub profile for ${student.githubUsername}:`, error);
          errorCount++;
          
          // If rate limited, stop fetching more
          if (error.message?.includes('rate limit')) {
            alert(error.message);
            break;
          }
        }
      }
      
      // Update the roster store with the updated data
      roster.set(updatedRoster);
      updateGithubCounters();
      
      // Show results
      if (successCount > 0 || errorCount > 0) {
        log.debug(`GitHub batch fetch: ${successCount} successful, ${errorCount} failed`);
      }
      
    } catch (error) {
      log.error('Error in loadMoreGithubProfiles:', error);
      alert(`Error loading GitHub profiles: ${error.message}`);
    } finally {
      isLoadingGithub = false;
    }
  }
  
  // Backward compatibility for the existing button
  async function fetchGitHubProfiles() {
    updateGithubCounters();
    
    if (githubProfilesTotal === 0) {
      alert('No students with GitHub usernames found.');
      return;
    }
    
    const remaining = githubProfilesTotal - githubProfilesLoaded;
    if (remaining === 0) {
      alert('All GitHub profiles are already loaded.');
      return;
    }
    
    if (!confirm(`This will fetch GitHub profiles in batches of ${githubBatchSize}. Continue?`)) {
      return;
    }
    
    await loadMoreGithubProfiles();
  }

  function exportData(format) {
    if (filteredRoster.length === 0) {
      alert("No data to export.");
      return;
    }

    let content, filename, type;

    if (format === 'json') {
      // Create a deep copy of the data to avoid modifying the actual state
      const exportData = JSON.parse(JSON.stringify(filteredRoster));
      
      // Make sure the message data is properly included
      exportData.forEach(student => {
        if (!student.messages) {
          student.messages = [];
        }
      });
      
      content = JSON.stringify(exportData, null, 2);
      filename = 'student-data.json';
      type = 'application/json';
    } else if (format === 'csv') {
      // Get all unique keys across all student objects (excluding messages array)
      const keys = new Set();
      filteredRoster.forEach(student => {
        Object.keys(student).forEach(key => {
          // Skip the messages array for CSV as it's nested data
          if (key !== 'messages') {
            keys.add(key);
          }
        });
      });
      
      // Add a column to indicate if the student has messages
      keys.add('hasMessages');
      
      const headers = Array.from(keys);
      
      // Create CSV content
      const csvRows = [headers.join(',')];
      
      filteredRoster.forEach(student => {
        const row = headers.map(header => {
          if (header === 'hasMessages') {
            // Add a boolean indicating if the student has messages
            return student.messages && student.messages.length > 0 ? 'true' : 'false';
          }
          
          const value = student[header] || '';
          
          // Handle nested objects (except arrays)
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;  
          }
          
          // Handle arrays (just count them)
          if (Array.isArray(value)) {
            return value.length;
          }
          
          // Handle strings with commas, quotes, etc.
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      });
      
      content = csvRows.join('\n');
      filename = 'student-data.csv';
      type = 'text/csv';
    } else if (format === 'messages-only') {
      // Export just the messages data
      const messagesData = {};
      
      filteredRoster.forEach(student => {
        if (student.messages && student.messages.length > 0) {
          // Use a combination of name and ID as the key
          const studentKey = `${student.First || ''} ${student.Last || ''} (${student.studentId})`;
          messagesData[studentKey] = student.messages;
        }
      });
      
      content = JSON.stringify(messagesData, null, 2);
      filename = 'student-messages.json';
      type = 'application/json';
    } else {
      alert('Unsupported export format');
      return;
    }

    // Create a downloadable blob
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
</script>

<div>
  <div class="top-bar">
    <div>
      {filteredRoster.length} record{filteredRoster.length === 1 ? "" : "s"} displayed
      <div class="github-status">
        <span class="github-status">
          GitHub: {githubProfilesLoaded}/{githubProfilesTotal} profiles loaded
          {#if Object.keys(cachedGithubProfiles).length > 0}
            <span class="github-cache-info">
              ({Object.keys(cachedGithubProfiles).length} in cache)
            </span>
          {/if}
        </span>
      </div>
    </div>
    <div>
      <button on:click={copyEmails}>Copy Emails</button>
      <div class="github-controls">
        <button on:click={loadMoreGithubProfiles} disabled={isLoadingGithub || (githubProfilesLoaded === githubProfilesTotal && githubProfilesTotal > 0)}>
          {#if isLoadingGithub}
            Loading...
          {:else if githubProfilesTotal === 0}
            No GitHub Usernames Found
          {:else if githubProfilesLoaded === githubProfilesTotal}
            All GitHub Profiles Loaded
          {:else}
            Load More GitHub ({Math.min(githubBatchSize, githubProfilesTotal - githubProfilesLoaded)})
          {/if}
        </button>
        <button on:click={clearGithubProfiles} disabled={githubProfilesLoaded === 0}>Clear GitHub Profiles</button>
      </div>
      <div class="export-dropdown">
        <button class="export-btn">Export Data</button>
        <div class="export-content">
          <button on:click={() => exportData('json')}>JSON (All Data)</button>
          <button on:click={() => exportData('csv')}>CSV (All Data)</button>
          <button on:click={() => exportData('messages-only')}>Messages Only</button>
        </div>
      </div>
      <button on:click={clearRecords}>Clear All Records</button>
    </div>
  </div>

  <UploadButtons />
  <FilterBar />

  <div class="view-switcher">
    <button on:click={() => setView("grid")} class:active={viewMode === "grid"}
      >Grid View</button
    >
    <button on:click={() => setView("list")} class:active={viewMode === "list"}
      >List View</button
    >
  </div>

  {#if filteredRoster.length === 0}
    <p style="text-align:center; color:#666;">
      No students found. Upload data or adjust filters.
    </p>
  {:else if viewMode === "grid"}
    <StudentGrid {filteredRoster} />
  {:else}
    <StudentList {filteredRoster} />
  {/if}
</div>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .top-bar button {
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border: none;
    background: #007acc;
    color: white;
    cursor: pointer;
    border-radius: 4px;
  }
  .top-bar button:hover:not(:disabled) {
    background: #005ea2;
  }
  .top-bar button:disabled {
    background: #7caad1;
    cursor: not-allowed;
  }
  .github-status {
    display: inline-block;
    margin-left: 1rem;
    padding: 0.25rem 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
    color: #555;
    font-size: 0.9rem;
  }
  .github-cache-info {
    font-size: 0.8rem;
    color: #777;
    margin-left: 0.5rem;
  }
  .github-controls {
    display: inline-flex;
    gap: 0.25rem;
  }
  .export-dropdown {
    position: relative;
    display: inline-block;
  }
  .export-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 120px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    border-radius: 4px;
  }
  .export-content button {
    color: black;
    background: white;
    padding: 12px 16px;
    display: block;
    width: 100%;
    text-align: left;
    border: none;
  }
  .export-content button:hover {
    background-color: #f1f1f1;
    color: #005ea2;
  }
  .export-dropdown:hover .export-content {
    display: block;
  }
  .view-switcher {
    margin: 1rem 0;
    text-align: center;
  }
  .view-switcher button {
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border: none;
    background: #007acc;
    color: white;
    cursor: pointer;
    border-radius: 4px;
  }
  .view-switcher button.active,
  .view-switcher button:hover {
    background: #005ea2;
  }
</style>
