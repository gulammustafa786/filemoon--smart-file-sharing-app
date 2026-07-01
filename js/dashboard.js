// ============================================
// FileMoon - Dashboard Script (dashboard.js)
// Handles auth check, uploads, folders, files,
// history, sharing and profile using LocalStorage
// ============================================

// ---------- Auth Guard ----------
// Make sure a user is logged in, otherwise send them to the login page
const currentUserRaw = localStorage.getItem("currentUser");
if (!currentUserRaw) {
  window.location.href = "login.html";
}
const currentUser = JSON.parse(currentUserRaw || "{}");

// Find the full user record (name, email) from the users list
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}
const users = getUsers();
const loggedInUser = users.find(function (u) { return u.id === currentUser.id; });

// If for some reason the user record is missing, log out and redirect
if (!loggedInUser) {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// ---------- Default Folders (seeded only once) ----------
function getFolders() {
  return JSON.parse(localStorage.getItem("folders")) || [];
}

function saveFolders(folders) {
  localStorage.setItem("folders", JSON.stringify(folders));
}

if (getFolders().length === 0) {
  const defaultFolders = [
    { id: "f1", name: "Programming" },
    { id: "f2", name: "Notes" },
    { id: "f3", name: "Assignments" },
    { id: "f4", name: "Images" }
  ];
  saveFolders(defaultFolders);
}

// ---------- LocalStorage Helpers ----------
function getFiles() {
  return JSON.parse(localStorage.getItem("files")) || [];
}
function saveFiles(files) {
  localStorage.setItem("files", JSON.stringify(files));
}
function getHistory() {
  return JSON.parse(localStorage.getItem("history")) || [];
}
function saveHistory(history) {
  localStorage.setItem("history", JSON.stringify(history));
}

// Get only the files/history that belong to the logged in user
function getMyFiles() {
  return getFiles().filter(function (f) { return f.userId === currentUser.id; });
}
function getMyHistory() {
  return getHistory().filter(function (h) { return h.userId === currentUser.id; });
}

// Add a new entry into the history log
function addHistoryEntry(action, fileName) {
  const history = getHistory();
  history.unshift({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    userId: currentUser.id,
    action: action,
    fileName: fileName,
    date: new Date().toLocaleString()
  });
  saveHistory(history);
}

// Format bytes into readable size (KB / MB)
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Generate a random share link like https://filemoon.local/share/ABCD1234
function generateShareLink() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "https://filemoon.local/share/" + code;
}

// ---------- Topbar / Welcome / Profile Info ----------
const initials = loggedInUser.name.trim().charAt(0).toUpperCase() || "U";
document.querySelector("#topbarUserName").textContent = loggedInUser.name;
document.querySelector("#topbarAvatar").textContent = initials;
document.querySelector("#welcomeName").textContent = loggedInUser.name;
document.querySelector("#profileAvatar").textContent = initials;
document.querySelector("#profileName").textContent = loggedInUser.name;
document.querySelector("#profileEmail").textContent = loggedInUser.email;

// ============================================
// SIDEBAR NAVIGATION (switching sections)
// ============================================
const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const sections = document.querySelectorAll(".dash-section");

sidebarLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    // Update active link styling
    sidebarLinks.forEach(function (l) { l.classList.remove("active"); });
    link.classList.add("active");

    // Show the matching section, hide the rest
    const target = link.getAttribute("data-section");
    sections.forEach(function (section) {
      section.classList.toggle("active", section.id === "section-" + target);
    });

    // Close mobile sidebar after choosing a section
    document.querySelector("#sidebar").classList.remove("open");
    document.querySelector("#sidebarOverlay").classList.remove("show");

    // Refresh data whenever a section is opened
    renderAll();
  });
});

// Mobile sidebar toggle
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebar = document.querySelector("#sidebar");
const sidebarOverlay = document.querySelector("#sidebarOverlay");

sidebarToggle.addEventListener("click", function () {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("show");
});
sidebarOverlay.addEventListener("click", function () {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
});

// ============================================
// LOGOUT
// ============================================
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
document.querySelector("#logoutBtn").addEventListener("click", logout);
document.querySelector("#profileLogoutBtn").addEventListener("click", logout);

// ============================================
// TOAST NOTIFICATION
// ============================================
const toast = document.querySelector("#toast");
const toastText = document.querySelector("#toastText");
let toastTimer = null;

function showToast(message, withCopyLink) {
  toastText.innerHTML = "";

  const span = document.createElement("span");
  span.textContent = message;
  toastText.appendChild(span);

  if (withCopyLink) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "toast-copy";
    copyBtn.textContent = "Copy Link";
    copyBtn.addEventListener("click", function () {
      copyToClipboard(withCopyLink);
    });
    toastText.appendChild(document.createElement("br"));
    toastText.appendChild(copyBtn);
  }

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 4000);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () {
      showToast("Link copied to clipboard!");
    });
  } else {
    // Fallback for older browsers
    const tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    showToast("Link copied to clipboard!");
  }
}

// ============================================
// UPLOAD FILE
// ============================================
const fileInput = document.querySelector("#fileInput");
const folderSelect = document.querySelector("#folderSelect");
const uploadBtn = document.querySelector("#uploadBtn");
const uploadMsg = document.querySelector("#uploadMsg");

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB limit (LocalStorage has limited space)
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function showUploadMsg(text, type) {
  uploadMsg.textContent = text;
  uploadMsg.className = "upload-msg show " + type;
}

uploadBtn.addEventListener("click", function () {
  const file = fileInput.files[0];

  if (!file) {
    showUploadMsg("Please choose a file first.", "error");
    return;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    showUploadMsg("Only PDF, JPG, JPEG and PNG files are allowed.", "error");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showUploadMsg("File is too large. Maximum size is 2 MB.", "error");
    return;
  }

  // Read the file as Base64 so it can be stored inside LocalStorage
  const reader = new FileReader();
  reader.onload = function () {
    const files = getFiles();

    const newFile = {
      id: Date.now().toString(),
      userId: currentUser.id,
      folder: folderSelect.value,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadDate: new Date().toLocaleString(),
      shareLink: generateShareLink(),
      base64Data: reader.result
    };

    files.push(newFile);
    saveFiles(files);
    addHistoryEntry("Uploaded", file.name);

    showUploadMsg("File uploaded successfully!", "success");
    fileInput.value = "";
    renderAll();
  };

  reader.onerror = function () {
    showUploadMsg("Something went wrong while reading the file.", "error");
  };

  reader.readAsDataURL(file);
});

// ============================================
// FOLDERS
// ============================================
const newFolderNameInput = document.querySelector("#newFolderName");
const createFolderBtn = document.querySelector("#createFolderBtn");
const folderGrid = document.querySelector("#folderGrid");

createFolderBtn.addEventListener("click", function () {
  const name = newFolderNameInput.value.trim();

  if (name === "") {
    showToast("Please enter a folder name.");
    return;
  }

  const folders = getFolders();
  const alreadyExists = folders.some(function (f) {
    return f.name.toLowerCase() === name.toLowerCase();
  });

  if (alreadyExists) {
    showToast("A folder with this name already exists.");
    return;
  }

  folders.push({ id: Date.now().toString(), name: name });
  saveFolders(folders);
  newFolderNameInput.value = "";
  showToast("Folder created successfully!");
  renderAll();
});

// Delete a folder (files inside it become "No Folder")
function deleteFolder(folderId, folderName) {
  const confirmDelete = confirm('Delete the folder "' + folderName + '"? Files inside it will be moved to "No Folder".');
  if (!confirmDelete) return;

  let folders = getFolders();
  folders = folders.filter(function (f) { return f.id !== folderId; });
  saveFolders(folders);

  // Unassign files that were inside this folder
  let files = getFiles();
  files = files.map(function (f) {
    if (f.folder === folderName) {
      f.folder = "";
    }
    return f;
  });
  saveFiles(files);

  showToast("Folder deleted.");
  renderAll();
}

// ============================================
// FOLDER CONTENTS MODAL (open a folder, view its files/images)
// ============================================
const folderModalOverlay = document.querySelector("#folderModalOverlay");
const folderModalTitle = document.querySelector("#folderModalTitle");
const folderModalSubtitle = document.querySelector("#folderModalSubtitle");
const folderModalBody = document.querySelector("#folderModalBody");
const folderModalClose = document.querySelector("#folderModalClose");

// SVG icon shown for non-image files (PDF etc.)
function getFileIconSvg() {
  return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6l2 3h8v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>';
}

// Open a folder: show every file inside it, with image previews for pictures
function openFolder(folderName) {
  const myFiles = getMyFiles().filter(function (f) { return f.folder === folderName; });

  folderModalTitle.textContent = folderName;
  folderModalSubtitle.textContent = myFiles.length + " file(s)";
  folderModalBody.innerHTML = "";

  if (myFiles.length === 0) {
    folderModalBody.innerHTML = '<div class="modal-empty">This folder is empty.</div>';
  } else {
    const grid = document.createElement("div");
    grid.className = "folder-file-grid";

    myFiles.forEach(function (file) {
      const isImage = file.fileType === "image/png" || file.fileType === "image/jpeg" || file.fileType === "image/jpg";

      const card = document.createElement("div");
      card.className = "folder-file-card";
      card.innerHTML =
        '<div class="folder-file-thumb">' +
          (isImage
            ? '<img src="' + file.base64Data + '" alt="' + file.fileName + '" />'
            : getFileIconSvg()) +
        '</div>' +
        '<div class="folder-file-info">' +
          '<div class="folder-file-name" title="' + file.fileName + '">' + file.fileName + '</div>' +
          '<div class="folder-file-meta">' + getFileTypeLabel(file.fileType) + ' &middot; ' + formatSize(file.fileSize) + '</div>' +
        '</div>';

      // Clicking a file inside the folder opens/downloads it
      card.addEventListener("click", function () {
        downloadFile(file.id);
      });

      grid.appendChild(card);
    });

    folderModalBody.appendChild(grid);
  }

  folderModalOverlay.classList.add("show");
}

function closeFolderModal() {
  folderModalOverlay.classList.remove("show");
}

folderModalClose.addEventListener("click", closeFolderModal);
folderModalOverlay.addEventListener("click", function (e) {
  if (e.target === folderModalOverlay) closeFolderModal();
});

// ============================================
// MOVE FILE INTO FOLDER
// ============================================
const moveFileSelect = document.querySelector("#moveFileSelect");
const moveFolderSelect = document.querySelector("#moveFolderSelect");
const moveFileBtn = document.querySelector("#moveFileBtn");

moveFileBtn.addEventListener("click", function () {
  const fileId = moveFileSelect.value;
  const targetFolder = moveFolderSelect.value;

  if (!fileId) {
    showToast("Please select a file to move.");
    return;
  }

  const files = getFiles();
  const file = files.find(function (f) { return f.id === fileId; });
  if (file) {
    file.folder = targetFolder;
    saveFiles(files);
    showToast("File moved successfully!");
    renderAll();
  }
});

// ============================================
// FILE ACTIONS: Download / Share / Delete
// ============================================
function downloadFile(fileId) {
  const files = getFiles();
  const file = files.find(function (f) { return f.id === fileId; });
  if (!file) return;

  // Create a temporary link to trigger the browser download
  const link = document.createElement("a");
  link.href = file.base64Data;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  addHistoryEntry("Downloaded", file.fileName);
  renderAll();
}

function shareFile(fileId) {
  const files = getFiles();
  const file = files.find(function (f) { return f.id === fileId; });
  if (!file) return;

  showToast("Share link ready for " + file.fileName, file.shareLink);
}

function deleteFile(fileId) {
  const files = getFiles();
  const file = files.find(function (f) { return f.id === fileId; });
  if (!file) return;

  const confirmDelete = confirm('Delete "' + file.fileName + '"? This cannot be undone.');
  if (!confirmDelete) return;

  const updatedFiles = files.filter(function (f) { return f.id !== fileId; });
  saveFiles(updatedFiles);
  addHistoryEntry("Deleted", file.fileName);

  showToast("File deleted.");
  renderAll();
}

// ============================================
// SEARCH
// ============================================
const searchInput = document.querySelector("#searchInput");
searchInput.addEventListener("input", function () {
  renderFileTable(searchInput.value.trim().toLowerCase());
});

// ============================================
// RENDER FUNCTIONS
// ============================================

// Build a small icon badge based on file type
function getFileTypeLabel(fileType) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType === "image/png") return "PNG";
  return "JPG";
}

// Render the main file table (Dashboard section)
function renderFileTable(searchTerm) {
  const tbody = document.querySelector("#fileTableBody");
  let myFiles = getMyFiles();

  if (searchTerm) {
    myFiles = myFiles.filter(function (f) {
      return f.fileName.toLowerCase().includes(searchTerm);
    });
  }

  tbody.innerHTML = "";

  if (myFiles.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No files uploaded yet.</td></tr>';
    return;
  }

  myFiles.forEach(function (file) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="file-name-cell">' + file.fileName + '</div></td>' +
      '<td><span class="file-type-badge">' + getFileTypeLabel(file.fileType) + '</span></td>' +
      '<td>' + (file.folder || "No Folder") + '</td>' +
      '<td>' + formatSize(file.fileSize) + '</td>' +
      '<td>' + file.uploadDate + '</td>' +
      '<td><div class="action-cell">' +
        '<button class="icon-btn download" title="Download" data-action="download" data-id="' + file.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>' +
        '<button class="icon-btn share" title="Share" data-action="share" data-id="' + file.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-3.9M8.6 13.5l6.8 3.9"/></svg></button>' +
        '<button class="icon-btn delete" title="Delete" data-action="delete" data-id="' + file.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></button>' +
      '</div></td>';
    tbody.appendChild(tr);
  });

  // Attach click listeners to the action buttons
  tbody.querySelectorAll("[data-action]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "download") downloadFile(id);
      if (action === "share") shareFile(id);
      if (action === "delete") deleteFile(id);
    });
  });
}

// Render the history table
function renderHistoryTable() {
  const tbody = document.querySelector("#historyTableBody");
  const myHistory = getMyHistory();

  tbody.innerHTML = "";

  if (myHistory.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No history yet.</td></tr>';
    return;
  }

  myHistory.forEach(function (entry) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td>' + entry.fileName + '</td>' +
      '<td><span class="history-action ' + entry.action.toLowerCase() + '">' + entry.action + '</span></td>' +
      '<td>' + entry.date + '</td>';
    tbody.appendChild(tr);
  });
}

// Render folder grid + folder dropdowns
function renderFolders() {
  const folders = getFolders();
  const myFiles = getMyFiles();

  // Folder grid cards
  folderGrid.innerHTML = "";
  if (folders.length === 0) {
    folderGrid.innerHTML = '<p style="color:var(--fm-text-soft); font-size:14px;">No folders created yet.</p>';
  } else {
    folders.forEach(function (folder) {
      const count = myFiles.filter(function (f) { return f.folder === folder.name; }).length;

      const card = document.createElement("div");
      card.className = "folder-card";
      card.innerHTML =
        '<div class="folder-card-left" data-open-folder="' + folder.name + '">' +
          '<div class="folder-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg></div>' +
          '<div><div class="folder-name">' + folder.name + '</div><div class="folder-count">' + count + ' file(s)</div></div>' +
        '</div>' +
        '<button class="icon-btn delete" title="Delete Folder" data-folder-id="' + folder.id + '" data-folder-name="' + folder.name + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></button>';
      folderGrid.appendChild(card);
    });

    folderGrid.querySelectorAll("[data-folder-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteFolder(btn.getAttribute("data-folder-id"), btn.getAttribute("data-folder-name"));
      });
    });

    // Clicking a folder (icon + name area) opens it and shows its files/images
    folderGrid.querySelectorAll("[data-open-folder]").forEach(function (el) {
      el.addEventListener("click", function () {
        openFolder(el.getAttribute("data-open-folder"));
      });
    });
  }

  // Populate folder dropdowns (Upload section + Move section)
  [folderSelect, moveFolderSelect].forEach(function (select) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">No Folder</option>';
    folders.forEach(function (folder) {
      const opt = document.createElement("option");
      opt.value = folder.name;
      opt.textContent = folder.name;
      select.appendChild(opt);
    });
    select.value = currentValue;
  });

  // Populate the "file to move" dropdown
  moveFileSelect.innerHTML = "";
  if (myFiles.length === 0) {
    moveFileSelect.innerHTML = '<option value="">No files available</option>';
  } else {
    myFiles.forEach(function (file) {
      const opt = document.createElement("option");
      opt.value = file.id;
      opt.textContent = file.fileName;
      moveFileSelect.appendChild(opt);
    });
  }
}

// Render shared files table
function renderSharedTable() {
  const tbody = document.querySelector("#sharedTableBody");
  const myFiles = getMyFiles();

  tbody.innerHTML = "";

  if (myFiles.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No shared files yet.</td></tr>';
    return;
  }

  myFiles.forEach(function (file) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td>' + file.fileName + '</td>' +
      '<td>' + file.shareLink + '</td>' +
      '<td><button class="btn btn-outline btn-sm" data-copy="' + file.shareLink + '">Copy Link</button></td>';
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyToClipboard(btn.getAttribute("data-copy"));
    });
  });
}

// Render dashboard statistics
function renderStats() {
  const myFiles = getMyFiles();
  const myHistory = getMyHistory();
  const folders = getFolders();

  const downloadsCount = myHistory.filter(function (h) { return h.action === "Downloaded"; }).length;

  document.querySelector("#statFiles").textContent = myFiles.length;
  document.querySelector("#statDownloads").textContent = downloadsCount;
  document.querySelector("#statFolders").textContent = folders.length;
  document.querySelector("#statShared").textContent = myFiles.length;

  document.querySelector("#profileTotalFiles").textContent = myFiles.length;
  document.querySelector("#profileTotalFolders").textContent = folders.length;
}

// Render everything at once
function renderAll() {
  renderStats();
  renderFileTable(searchInput.value.trim().toLowerCase());
  renderHistoryTable();
  renderFolders();
  renderSharedTable();
}

// Initial render when the dashboard loads
renderAll();
