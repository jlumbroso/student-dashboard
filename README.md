# Student Dashboard

A Svelte + Vite application that merges data from three sources:

- **Classlist JSON:** Contains student photos, names, majors, classifications, etc.
- **GitHub CSV:** Maps PennID (column `"Your PennID:"`) to GitHub usernames (column `"Your GitHub username:"`), using the latest timestamp.
- **Slack CSV:** Maps email addresses to Slack user info (userid, fullname, displayname).

## Features

- **Message Tracking:** Import messages from JSON files (containing username, timestamp, and text) and associate them with students based on Slack usernames.

- **File Uploads:** Upload your classlist JSON, GitHub CSV, Slack CSV, and Message JSON files.
- **Data Merge:** Merges data by matching:
  - **PennID** (for GitHub CSV)
  - **Email Address** (for Slack CSV)
  - **Slack Username** (for Message JSON)
- **Persistent Storage:** Uses IndexedDB to persist data.
- **Filtering:** Filter students by search (name/email), GitHub presence, Slack presence, major, and classification.
   - **Search Tags:** An autocomplete tag–input (suggesting names/emails from the roster)
- **View Modes:** Toggle between a grid view (with a hover overlay) and a list view.
- **UI Feedback:** Displays a loading indicator while files are processed and shows confirmation messages.
- **Record Management:** A button to clear all records, export data (as JSON, CSV, or Messages-only), and a display of the number of records currently shown.
- **Tasteful Styling:** Responsive, modern design.
- **Logging:** Uses [loglevel](https://github.com/pimterry/loglevel) for debug-friendly logging.

## How to Run Locally

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Open your browser** at the URL provided (e.g., `http://localhost:5173/student-dashboard/`).

## Contributing

Feel free to fork and submit pull requests with improvements.

## License

This project is licensed under the MIT License.