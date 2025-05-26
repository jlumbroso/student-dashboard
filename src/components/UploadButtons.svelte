<script>
  import log from "loglevel";
  import Papa from "papaparse";
  import { roster } from "../lib/store.js";
  import { get } from 'svelte/store';

  log.setLevel("debug");

  let loadingMessage = "";
  let confirmationMessage = "";

  // Process Classlist JSON.
  async function handleClasslistJson(file) {
    loadingMessage = "Loading classlist JSON...";
    log.debug("Processing JSON file:", file);
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      log.debug("Parsed JSON data:", data);
      log.debug("Found", data.length, "students in JSON.");
      roster.set(data);
      confirmationMessage = `Loaded ${data.length} students from JSON.`;
    } catch (err) {
      log.error("Error parsing JSON:", err);
      confirmationMessage = `Error loading JSON: ${err.message}`;
    } finally {
      loadingMessage = "";
    }
  }

  // Process GitHub CSV.
  async function handleGithubCsv(file) {
    loadingMessage = "Loading GitHub CSV...";
    log.debug("Processing GitHub CSV file:", file);
    if (!file) return;
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    log.debug("Parsed GitHub CSV:", parsed);
    const rows = parsed.data;
    const githubMap = {};

    // Count updated records.
    let countUpdated = 0;

    for (const row of rows) {
      // Expect headers with trailing colons.
      const pennId = row["Your PennID:"] ? row["Your PennID:"].trim() : null;
      if (!pennId) continue;
      const timestampStr = row["Timestamp"] ? row["Timestamp"].trim() : "";
      const dateVal = new Date(timestampStr).valueOf() || 0;
      // Fix: define variable as githubUsername.
      const githubUsername = row["Your GitHub username:"]
        ? row["Your GitHub username:"].trim()
        : null;
      if (!githubMap[pennId] || dateVal > githubMap[pennId].dateVal) {
        githubMap[pennId] = { dateVal, githubUsername };
      }
    }
    log.debug("Built GitHub map:", githubMap);
    // Merge GitHub data into the roster.
    roster.update((currentRoster) => {
      return currentRoster.map((student) => {
        const matching = githubMap[student.studentId];
        if (
          matching &&
          matching.githubUsername &&
          student.githubUsername !== matching.githubUsername
        ) {
          countUpdated++;
          return { ...student, githubUsername: matching.githubUsername };
        }
        return student;
      });
    });
    confirmationMessage =
      countUpdated > 0
        ? `GitHub CSV processed: updated ${countUpdated} record${countUpdated === 1 ? "" : "s"}.`
        : "GitHub CSV processed: no changes made.";
    loadingMessage = "";
  }

  // Process Slack CSV.
  async function handleSlackCsv(file) {
    loadingMessage = "Loading Slack CSV...";
    log.debug("Processing Slack CSV file:", file);
    if (!file) return;
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });
    log.debug("Parsed Slack CSV:", parsed);
    const rows = parsed.data;
    const slackMap = {};
    
    // Track statistics for logging
    let rowCount = 0;
    let skippedRows = 0;
    
    for (const row of rows) {
      if (!row.email) {
        skippedRows++;
        continue;
      }
      
      rowCount++;
      const email = row.email.trim().toLowerCase();
      
      // Save ALL identifiers from the CSV
      const username = row.username ? row.username.trim() : null;
      const userId = row.userid ? row.userid.trim() : null;
      const fullname = row.fullname ? row.fullname.trim() : null;
      const displayname = row.displayname ? row.displayname.trim() : null;
      const status = row.status ? row.status.trim() : null;
      
      slackMap[email] = { username, userId, fullname, displayname, status };
      log.debug(`Processing Slack user: email=${email}, username=${username}, fullname=${fullname}, displayname=${displayname}`);
    }
    
    log.debug(`Processed ${rowCount} Slack users (skipped ${skippedRows} rows without email)`);
    log.debug("Built Slack map:", slackMap);
    
    let matchedCount = 0;
    
    roster.update((currentRoster) => {
      return currentRoster.map((student) => {
        const stuEmail = student.EmailAddress
          ? student.EmailAddress.toLowerCase()
          : "";
        const match = slackMap[stuEmail];
        
        if (match) {
          matchedCount++;
          log.debug(`Matched student ${student.First} ${student.Last} with Slack user: ${match.username || "<no username>"}`);
          
          return {
            ...student,
            slackUsername: match.username, // Store the actual username field from CSV
            slackUserId: match.userId,
            slackFullname: match.fullname,
            slackDisplayname: match.displayname,
            slackStatus: match.status
          };
        }
        return student;
      });
    });
    
    confirmationMessage = `Slack CSV processed: matched ${matchedCount} students with Slack data.`;
    loadingMessage = "";
  }

  // Process Message JSON files
  async function handleMessageJson(file) {
    loadingMessage = "Loading message JSON...";
    log.debug("Processing message JSON file:", file);
    if (!file) return;

    try {
      const text = await file.text();
      const messages = JSON.parse(text);
      log.debug("Parsed message data:", messages);
      log.debug(`Found ${messages.length} messages in JSON file ${file.name}`);
      
      const fileName = file.name;
      let matchCount = 0;
      let studentUpdates = 0;
      let unmatchedUsernames = new Set();
      
      // Get the current roster
      const currentRoster = get(roster);
      
      // Create a map of Slack usernames to student indices for faster lookup
      const usernameMap = {};
      let slackUsernameCount = 0;
      
      // Count students with different identifiers for logging
      let studentsWithUsername = 0;
      let studentsWithDisplayname = 0;
      let studentsWithFullname = 0;
      
      currentRoster.forEach((student, index) => {
        // Primary match: use the actual username field from Slack CSV
        if (student.slackUsername) {
          usernameMap[student.slackUsername.toLowerCase()] = index;
          slackUsernameCount++;
          studentsWithUsername++;
          log.debug(`Student ${student.First} ${student.Last} has Slack username: ${student.slackUsername}`);
        }
        
        // Secondary matches
        if (student.slackDisplayname) {
          usernameMap[student.slackDisplayname.toLowerCase()] = index;
          studentsWithDisplayname++;
        }
        
        if (student.slackFullname) {
          usernameMap[student.slackFullname.toLowerCase()] = index;
          studentsWithFullname++;
        }
      });
      
      log.debug(`Roster stats: ${slackUsernameCount}/${currentRoster.length} students have Slack usernames`);
      log.debug(`Identity types: username=${studentsWithUsername}, displayname=${studentsWithDisplayname}, fullname=${studentsWithFullname}`);
      
      // Message username counts for debugging
      const messageUsernames = new Set();
      messages.forEach(msg => {
        if (msg.username) messageUsernames.add(msg.username.toLowerCase());
      });
      log.debug(`Found ${messageUsernames.size} unique usernames in message data`);
      
      // Collect all usernames from messages for debugging
      const messageUsernamesList = Array.from(messageUsernames);
      log.debug(`Message usernames (first 10): ${messageUsernamesList.slice(0, 10).join(', ')}`);
      
      // Create a map to collect messages by student ID
      const messagesByStudent = new Map();
      
      // Process each message and try to match to a student
      messages.forEach(msg => {
        if (!msg.username) return;
        
        const username = msg.username.toLowerCase();
        const studentIndex = usernameMap[username];
        
        if (studentIndex !== undefined) {
          const student = currentRoster[studentIndex];
          if (student && student.studentId) {
            // Add message to the student's collection
            if (!messagesByStudent.has(student.studentId)) {
              messagesByStudent.set(student.studentId, []);
              studentUpdates++;
            }
            
            // Check if this message already exists for the student to prevent duplicates
            // First check against newly added messages
            const existingMessages = messagesByStudent.get(student.studentId);
            let isDuplicate = existingMessages.some(existingMsg => 
              existingMsg.text === msg.text && existingMsg.timestamp === msg.timestamp
            );
            
            // Then check against existing messages in the student record
            if (!isDuplicate && student.messages && Array.isArray(student.messages)) {
              isDuplicate = student.messages.some(existingMsg => 
                existingMsg.text === msg.text && existingMsg.timestamp === msg.timestamp
              );
            }
            
            if (!isDuplicate) {
              messagesByStudent.get(student.studentId).push({
                timestamp: msg.timestamp,
                date: new Date(msg.timestamp * 1000).toISOString(), // Store the date string for display
                source: fileName,
                text: msg.text,
                channel: msg.channel || '' // Store the channel without a default value
              });
            } else {
              log.debug(`Skipped duplicate message from '${username}'`);
            }
            
            matchCount++;
            log.debug(`Matched message from '${username}' to student ${student.First} ${student.Last}`);
          }
        } else {
          unmatchedUsernames.add(username);
        }
      });
      
      // Update the roster with the collected messages
      roster.update(currentRoster => {
        return currentRoster.map(student => {
          // Initialize messages array if it doesn't exist
          if (!student.messages) {
            student.messages = [];
          }
          
          // If this student has matched messages, add them
          if (student.studentId && messagesByStudent.has(student.studentId)) {
            // Deep clone the student messages to avoid reference issues
            const existingMessages = JSON.parse(JSON.stringify(student.messages || []));
            const newMessages = messagesByStudent.get(student.studentId);
            
            // Remove any existing duplicates before merging
            const uniqueMessages = [...existingMessages];
            
            // Only add messages that don't already exist
            newMessages.forEach(newMsg => {
              const isDuplicate = uniqueMessages.some(existingMsg => 
                existingMsg.text === newMsg.text && 
                existingMsg.timestamp === newMsg.timestamp
              );
              
              if (!isDuplicate) {
                uniqueMessages.push(newMsg);
              }
            });
            
            return {
              ...student,
              messages: uniqueMessages
            };
          }
          
          return student;
        });
      });
      
      // Log unmatched usernames for debugging
      log.debug(`Unmatched usernames (${unmatchedUsernames.size}): ${Array.from(unmatchedUsernames).slice(0, 10).join(', ')}...`);
      
      confirmationMessage = `Messages processed: matched ${matchCount} messages to ${studentUpdates} students. ${unmatchedUsernames.size} usernames couldn't be matched.`;
    } catch (err) {
      log.error("Error processing message JSON:", err);
      confirmationMessage = `Error processing message JSON: ${err.message}`;
    } finally {
      loadingMessage = "";
    }
  }

  function onClasslistChange(event) {
    const file = event.target.files[0];
    log.info("File selected for Classlist:", file);
    handleClasslistJson(file);
    event.target.value = "";
  }

  function onGithubChange(event) {
    const file = event.target.files[0];
    log.info("File selected for GitHub CSV:", file);
    handleGithubCsv(file);
    event.target.value = "";
  }

  function onSlackChange(event) {
    const file = event.target.files[0];
    log.info("File selected for Slack CSV:", file);
    handleSlackCsv(file);
    event.target.value = "";
  }

  function onMessagesChange(event) {
    const file = event.target.files[0];
    log.info("File selected for Message JSON:", file);
    handleMessageJson(file);
    event.target.value = "";
  }
  
  // Clear all messages from the roster
  function clearMessages() {
    if (confirm("Are you sure you want to clear all messages from all students?")) {
      let studentsWithMessages = 0;
      let totalMessages = 0;
      
      roster.update(currentRoster => {
        return currentRoster.map(student => {
          if (student.messages && student.messages.length > 0) {
            studentsWithMessages++;
            totalMessages += student.messages.length;
            return { ...student, messages: [] };
          }
          return student;
        });
      });
      
      confirmationMessage = `Cleared ${totalMessages} messages from ${studentsWithMessages} students.`;
    }
  }
</script>

<div class="upload-section">
  <h3>Upload Data</h3>
  <div>
    <label for="classlist">Classlist JSON:</label>
    <input
      id="classlist"
      type="file"
      accept=".json"
      on:change={onClasslistChange}
    />
  </div>
  <div>
    <label for="github">GitHub CSV:</label>
    <input id="github" type="file" accept=".csv" on:change={onGithubChange} />
  </div>
  <div>
    <label for="slack">Slack CSV:</label>
    <input id="slack" type="file" accept=".csv" on:change={onSlackChange} />
  </div>
  <div class="input-with-action">
    <div>
      <label for="messages">Message JSON:</label>
      <input id="messages" type="file" accept=".json" on:change={onMessagesChange} />
    </div>
    <button on:click={clearMessages} class="clear-button">Clear Messages</button>
  </div>

  {#if loadingMessage}
    <div class="status loading">{loadingMessage}</div>
  {/if}
  {#if confirmationMessage}
    <div class="status confirmation">{confirmationMessage}</div>
  {/if}
</div>

<style>
  .upload-section {
    background: #eef6fc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .upload-section > div {
    margin-bottom: 0.75rem;
  }
  label {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  input[type="file"] {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.25rem;
  }
  .status {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #333;
  }
  .loading {
    color: #007acc;
  }
  .confirmation {
    color: #28a745;
  }
  
  .input-with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .input-with-action > div {
    flex-grow: 1;
  }
  
  .clear-button {
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .clear-button:hover {
    background-color: #bd2130;
  }
</style>
