// Global variable to store current editing item
let currentEditingItem = null;

// Generate or get device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Profile Management
const profilePicture = document.getElementById('profile-picture');
const profilePictureInput = document.getElementById('profile-picture-input');
const profileNameInput = document.getElementById('profile-name');
const profileStatus = document.getElementById('profile-status');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Store used names and last name change timestamp
let usedNames = JSON.parse(localStorage.getItem('usedNames') || '[]');
let lastNameChange = parseInt(localStorage.getItem('lastNameChange') || '0');
let lastUpload = parseInt(localStorage.getItem('lastUpload') || '0');
const NAME_CHANGE_COOLDOWN = 120000; // 2 minutes in milliseconds
const UPLOAD_COOLDOWN = 600000; // 10 minutes in milliseconds

// Temporary storage for unsaved changes
let tempProfilePicture = null;
let tempProfileName = null;

// Add profanity filter function
const bannedWords = [
    'arsch', 'hurensohn', 'hure', 'fotze', 'schlampe', 'bastard', 'wichser', 'schwuchtel',
    'spast', 'idiot', 'depp', 'fick', 'scheiße', 'kacke', 'pimmel', 'penis', 'nutte'
];

function containsProfanity(text) {
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word));
}

// Add HTML for modal to the document body
document.addEventListener('DOMContentLoaded', function() {
    // Ensure we have a device ID
    getDeviceId();
    
    const searchInput = document.getElementById('search-input');
    const itemForm = document.getElementById('item-form');
    const universalToggle = document.getElementById('universal');
    const gameIdGroup = document.getElementById('game-id-group');
    const gameIdInput = document.getElementById('url');
    
    // Handle universal script toggle
    if (universalToggle) {
        universalToggle.addEventListener('change', function() {
            if (this.checked) {
                // Universal script selected - make game ID optional
                gameIdInput.removeAttribute('required');
                gameIdInput.placeholder = 'Optional for Universal Script';
            } else {
                // Normal script - game ID required
                gameIdInput.setAttribute('required', '');
                gameIdInput.placeholder = 'Enter Roblox Game ID';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            displayItems(e.target.value.toLowerCase());
        });
    }

    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Check if profile is complete first
            if (!checkProfileBeforeUpload()) {
                return;
            }

            // Check upload cooldown only if not D3f4ult
            const currentUser = localStorage.getItem('profileName');
            const now = Date.now();
            const timeSinceLastUpload = now - lastUpload;
            
            if (currentUser !== "D3f4ult" && timeSinceLastUpload < UPLOAD_COOLDOWN) {
                const remainingTime = formatTimeRemaining(UPLOAD_COOLDOWN - timeSinceLastUpload);
                alert(`Du kannst nur alle 10 Minuten ein Script hochladen. Bitte warte noch ${remainingTime}.`);
                return;
            }

            const name = document.getElementById('name').value;
            const imageFile = document.getElementById('image').files[0];
            const isUniversal = document.getElementById('universal').checked;
            const gameId = document.getElementById('url').value;
            const script = document.getElementById('script').value;

            // Check if script name already exists
            const existingItems = JSON.parse(localStorage.getItem('items') || '[]');
            if (existingItems.some(item => item.name.toLowerCase() === name.toLowerCase())) {
                alert('Ein Script mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
                return;
            }

            // Validate Game ID if not a universal script
            if (!isUniversal && (isNaN(gameId) || gameId <= 0)) {
                alert('Bitte gib eine gültige Roblox Game ID ein!');
                return;
            }

            // Check name length
            if (name.length > 40) {
                alert('Der Scriptname darf maximal 40 Zeichen lang sein.');
                return;
            }

            // Check for profanity in script name
            if (containsProfanity(name)) {
                alert('Der Scriptname enthält unangemessene Wörter. Bitte wähle einen anderen Namen.');
                return;
            }

            if (!imageFile) {
                alert('Bitte wähle ein Bild aus!');
                return;
            }

            // Get current profile data and device ID
            const uploaderName = localStorage.getItem('profileName');
            const uploaderPicture = localStorage.getItem('profilePicture');
            const deviceId = getDeviceId();

            // Convert image to base64
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create a new item object
                const item = {
                    id: Date.now(),
                    name: name,
                    image: e.target.result,
                    url: gameId,
                    script: script,
                    isUniversal: isUniversal,
                    date: new Date().toISOString(),
                    uploader: {
                        name: uploaderName,
                        picture: uploaderPicture,
                        deviceId: deviceId
                    }
                };

                // Save to localStorage
                existingItems.push(item);
                localStorage.setItem('items', JSON.stringify(existingItems));
                
                // Update last upload time
                localStorage.setItem('lastUpload', now.toString());
                lastUpload = now;

                // Reset form
                itemForm.reset();
                alert('Script erfolgreich hochgeladen!');
            };
            reader.readAsDataURL(imageFile);
        });
    }

    // Display items on home page
    displayItems();

    // Load profile
    loadProfile();
    
    // Add profile check to upload page
    if (window.location.pathname.includes('upload.html')) {
        if (!checkProfileBeforeUpload()) {
            return;
        }
    }
});

function formatScriptName(name) {
    let formattedName = '';
    for (let i = 0; i < name.length; i++) {
        formattedName += name[i];
        if ((i + 1) % 20 === 0 && i !== name.length - 1) {
            formattedName += '\n';
        }
    }
    return formattedName;
}

// Function to convert Game ID to Roblox URL
function getRobloxGameUrl(gameId) {
    return `https://www.roblox.com/games/${gameId}`;
}

// Add modal container to body
document.body.insertAdjacentHTML('beforeend', `
    <div class="detail-modal-overlay" style="display: none;">
        <div class="detail-modal">
            <button class="detail-close">Home</button>
            <div class="detail-modal-content">
                <img class="detail-image" src="" alt="Script preview">
                <h2 class="detail-title"></h2>
                <div class="detail-section">
                    <h3>Roblox Game ID</h3>
                    <div class="detail-url"></div>
                </div>
                <div class="detail-section">
                    <h3>Script Code</h3>
                    <div class="detail-script"></div>
                </div>
                <div class="detail-buttons">
                    <button class="url-button" onclick="window.open(this.dataset.url, '_blank')">GAME LINK</button>
                    <button class="script-button" data-script-id="">COPY SCRIPT</button>
                </div>
            </div>
        </div>
    </div>
`);

// Function to show script details
function showScriptDetails(item) {
    const modal = document.querySelector('.detail-modal-overlay');
    const image = modal.querySelector('.detail-image');
    const title = modal.querySelector('.detail-title');
    const url = modal.querySelector('.detail-url');
    const script = modal.querySelector('.detail-script');
    const urlButton = modal.querySelector('.url-button');
    const scriptButton = modal.querySelector('.script-button');

    // Set content
    image.src = item.image;
    image.alt = item.name;
    title.textContent = item.name;
    url.textContent = item.isUniversal ? 'Universal Script' : item.url;
    script.textContent = item.script;
    
    // Set URL button attributes and event handler
    urlButton.removeAttribute('onclick');
    urlButton.setAttribute('data-script-id', item.id);
    urlButton.addEventListener('click', function(e) {
        handleGoToGameClick(e, item);
    });
    
    scriptButton.dataset.scriptId = item.id;

    // Show modal
    modal.style.display = 'flex';

    // Add close functionality
    const closeButton = modal.querySelector('.detail-close');
    closeButton.onclick = () => modal.style.display = 'none';

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Add escape key listener
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });

    // Add copy script functionality
    scriptButton.onclick = () => copyScript(item.id);
}

// Display items on the home page
function displayItems(searchTerm = '') {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;
    
    // Clear the container
    itemsContainer.innerHTML = '';
    
    // Get items from localStorage
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const deviceId = getDeviceId();
    const currentUser = localStorage.getItem('profileName');
    
    // Filter and sort items
    items
        .filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(item => {
            const displayName = formatScriptName(item.name);

            // Check if the current user can edit this item
            const isCreator = 
                (item.uploader && currentUser === "D3f4ult") || 
                (item.uploader?.name === 'D3f4ult') || 
                (item.uploader?.deviceId === deviceId);
            
            const canEdit = isCreator || currentUser === "D3f4ult";
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <div class="item-image-container">
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                </div>
                <h3 title="${item.name}">${displayName}</h3>
                <div class="uploader-info">
                    <img src="${item.uploader?.picture || 'default-profile.png'}" alt="Uploader" class="uploader-picture">
                    <span class="uploader-name ${isCreator ? 'creator-name' : ''}">${
                        isCreator ? `by ${item.uploader?.name} 👑` : `by ${item.uploader?.name || 'Unknown'}`
                    }</span>
                </div>
                <div class="card-buttons">
                    <button class="url-button" data-script-id="${item.id}">GAME LINK</button>
                    <div class="script-button-group">
                    <button class="script-button" data-script-id="${item.id}">COPY SCRIPT</button>
                        ${canEdit ? `
                            <button class="edit-button" onclick="editScript('${item.id}')">EDIT SCRIPT</button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Add click handler for the entire card
            itemCard.onclick = (e) => {
                // Don't show details if clicking buttons
                if (!e.target.closest('button')) {
                    showScriptDetails(item);
                }
            };
            
            itemsContainer.appendChild(itemCard);
        });
    
    // Add event listeners for script copy buttons
    document.querySelectorAll('.script-button').forEach(button => {
        button.addEventListener('click', function() {
            const scriptId = this.getAttribute('data-script-id');
            copyScript(scriptId);
        });
    });

    // Add event listeners for Go To Game buttons
    document.querySelectorAll('.url-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const scriptId = this.getAttribute('data-script-id');
            const items = JSON.parse(localStorage.getItem('items') || '[]');
            const item = items.find(item => item.id.toString() === scriptId.toString());
            if (item) {
                handleGoToGameClick(e, item);
            }
        });
    });
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        let items = JSON.parse(localStorage.getItem('items') || '[]');
        items = items.filter(item => item.id !== id);
        localStorage.setItem('items', JSON.stringify(items));
        
        // Update both displays
        displayItems();
    }
}

// Copy script to clipboard
function copyScript(scriptId) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id.toString() === scriptId.toString());
    
    if (item) {
        navigator.clipboard.writeText(item.script)
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
}

// Load saved profile data
function loadProfile() {
    const savedName = localStorage.getItem('profileName');
    const savedPicture = localStorage.getItem('profilePicture');
    
    if (savedName) {
        profileNameInput.value = savedName;
        tempProfileName = savedName;
    }
    
    if (savedPicture) {
        profilePicture.src = savedPicture;
        tempProfilePicture = savedPicture;
    }
    
    updateProfileStatus();
}

// Format time remaining
function formatTimeRemaining(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? 
        `${minutes} Minute${minutes > 1 ? 'n' : ''} und ${remainingSeconds} Sekunde${remainingSeconds !== 1 ? 'n' : ''}` : 
        `${remainingSeconds} Sekunde${remainingSeconds !== 1 ? 'n' : ''}`;
}

// Save profile data
function saveProfile() {
    const newName = profileNameInput.value.trim();
    const currentName = localStorage.getItem('profileName');
    
    // Check if name is being changed
    if (newName !== currentName) {
        const now = Date.now();
        const timeSinceLastChange = now - lastNameChange;
        
        // Check cooldown only if not D3f4ult
        if (currentName !== "D3f4ult" && timeSinceLastChange < NAME_CHANGE_COOLDOWN) {
            const remainingTime = formatTimeRemaining(NAME_CHANGE_COOLDOWN - timeSinceLastChange);
            alert(`Du kannst deinen Namen nur alle 2 Minuten ändern. Bitte warte noch ${remainingTime}.`);
            profileNameInput.value = currentName;
            tempProfileName = currentName;
            return;
        }
        
        // Check if name is already taken
        if (usedNames.includes(newName)) {
            alert('Dieser Name ist bereits vergeben. Bitte wähle einen anderen Namen.');
            profileNameInput.value = currentName;
            tempProfileName = currentName;
        return;
        }
        
        // Remove old name from used names if it exists
        if (currentName) {
            usedNames = usedNames.filter(name => name !== currentName);
        }
        
        // Add new name to used names
        usedNames.push(newName);
        localStorage.setItem('usedNames', JSON.stringify(usedNames));
        localStorage.setItem('lastNameChange', now.toString());
        lastNameChange = now;
    }
    
    // Save new profile data
    localStorage.setItem('profileName', newName);
    if (tempProfilePicture) {
        localStorage.setItem('profilePicture', tempProfilePicture);
    }
    
    // Update temporary storage
    tempProfileName = newName;
    
    updateProfileStatus();
    alert('Profil erfolgreich gespeichert!');
}

// Update profile picture
profilePictureInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicture.src = e.target.result;
            tempProfilePicture = e.target.result;
            updateProfileStatus();
        }
        reader.readAsDataURL(file);
    }
});

// Update profile name
profileNameInput.addEventListener('input', function() {
    tempProfileName = this.value.trim();
    updateProfileStatus();
});

// Add click event listener to save button
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveProfile);
}

// Check if profile is complete
function isProfileComplete() {
    const hasName = tempProfileName && tempProfileName.trim() !== '';
    const hasPicture = tempProfilePicture && tempProfilePicture !== 'default-profile.png';
    return hasName && hasPicture;
}

// Update profile status
function updateProfileStatus() {
    const hasName = tempProfileName && tempProfileName.trim() !== '';
    const hasPicture = tempProfilePicture && tempProfilePicture !== 'default-profile.png';
    
    if (hasName && hasPicture) {
        profileStatus.textContent = 'Profile complete';
        profileStatus.classList.add('complete');
    } else {
        let missingItems = [];
        if (!hasName) missingItems.push('name');
        if (!hasPicture) missingItems.push('profile picture');
        profileStatus.textContent = `Profile incomplete - Missing: ${missingItems.join(' and ')}`;
        profileStatus.classList.remove('complete');
    }
}

// Check profile before upload
function checkProfileBeforeUpload() {
    const savedName = localStorage.getItem('profileName');
    const savedPicture = localStorage.getItem('profilePicture');
    
    if (!savedName || !savedPicture || savedPicture === 'default-profile.png') {
        let missingItems = [];
        if (!savedName) missingItems.push('name');
        if (!savedPicture || savedPicture === 'default-profile.png') missingItems.push('profile picture');
        alert(`Please complete your profile before uploading. You are missing: ${missingItems.join(' and ')}`);
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}

// Function to edit a script
function editScript(scriptId) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id.toString() === scriptId.toString());
    const deviceId = getDeviceId();
    const currentUser = localStorage.getItem('profileName');
    
    // Allow editing if user is D3f4ult or is the original uploader
    if (!item || (item.uploader?.deviceId !== deviceId && currentUser !== "D3f4ult")) {
        console.log('Unauthorized edit attempt');
        return;
    }
    
    // Create and show edit modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h2>Edit Script</h2>
            <div class="form-group">
                <label for="edit-name">Script Name</label>
                <input type="text" class="modern-input" id="edit-name" value="${item.name}" placeholder="Enter script name">
            </div>
            <div class="form-group">
                <label for="edit-image">Preview Image</label>
                <input type="file" class="modern-input" id="edit-image" accept="image/*">
                <div class="current-image">
                    <p>Current Image:</p>
                    <img src="${item.image}" alt="Current preview" style="max-width: 200px; margin-top: 10px; border-radius: 8px;">
                </div>
            </div>
            <div class="form-group toggle-container">
                <label for="edit-universal">Universal Script</label>
                <div class="toggle-switch">
                    <input type="checkbox" id="edit-universal" class="toggle-input" ${item.isUniversal ? 'checked' : ''}>
                    <label for="edit-universal" class="toggle-label"></label>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-url">Roblox Game ID</label>
                <input type="number" class="modern-input" id="edit-url" value="${item.url}" placeholder="${item.isUniversal ? 'Optional for Universal Script' : 'Enter Roblox Game ID'}" ${item.isUniversal ? '' : 'required'}>
            </div>
            <div class="form-group">
                <label for="edit-script">Script Content</label>
                <textarea class="modern-input" id="edit-script" placeholder="Enter script content" rows="5">${item.script}</textarea>
            </div>
            <div class="button-container">
                <button class="delete-button" onclick="deleteScript('${item.id}')">Delete</button>
                <div class="right-buttons">
                    <button class="cancel-button" onclick="closeModal()">Cancel</button>
                    <button class="save-button" onclick="saveScriptChanges('${item.id}')">Save</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentEditingItem = item;
    
    // Add event listener for universal toggle in edit modal
    document.getElementById('edit-universal').addEventListener('change', function() {
        const urlInput = document.getElementById('edit-url');
        if (this.checked) {
            // Universal script selected - make game ID optional
            urlInput.removeAttribute('required');
            urlInput.placeholder = 'Optional for Universal Script';
        } else {
            // Normal script - game ID required
            urlInput.setAttribute('required', '');
            urlInput.placeholder = 'Enter Roblox Game ID';
        }
    });
}

// Function to save script changes
function saveScriptChanges(scriptId) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const itemIndex = items.findIndex(item => item.id.toString() === scriptId.toString());
    const deviceId = getDeviceId();
    const currentUser = localStorage.getItem('profileName');
    
    if (itemIndex === -1) return;
    
    // Check if user has permission to edit
    if (items[itemIndex].uploader?.deviceId !== deviceId && currentUser !== "D3f4ult") {
        alert('Du hast keine Berechtigung, dieses Script zu bearbeiten.');
        return;
    }

    const newName = document.getElementById('edit-name').value;
    
    // Check name length
    if (newName.length > 40) {
        alert('Der Scriptname darf maximal 40 Zeichen lang sein.');
        return;
    }

    // Check if new name already exists (excluding the current script)
    if (items.some(item => item.id !== items[itemIndex].id && item.name.toLowerCase() === newName.toLowerCase())) {
        alert('Ein Script mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.');
        return;
    }

    // Check for profanity
    if (containsProfanity(newName)) {
        alert('Der Scriptname enthält unangemessene Wörter. Bitte wähle einen anderen Namen.');
        return;
    }
    
    const imageFile = document.getElementById('edit-image').files[0];
    const isUniversal = document.getElementById('edit-universal').checked;
    const gameId = document.getElementById('edit-url').value;
    
    // Validate Game ID if not a universal script
    if (!isUniversal && (isNaN(gameId) || gameId <= 0)) {
        alert('Bitte gib eine gültige Roblox Game ID ein!');
        return;
    }
    
    // If no new image is selected, save other changes immediately
    if (!imageFile) {
        items[itemIndex].name = newName;
        items[itemIndex].url = gameId;
        items[itemIndex].isUniversal = isUniversal;
        items[itemIndex].script = document.getElementById('edit-script').value;
        
        localStorage.setItem('items', JSON.stringify(items));
        closeModal();
        displayItems();
        return;
    }
    
    // If new image is selected, process it first
    const reader = new FileReader();
    reader.onload = function(e) {
        items[itemIndex].name = newName;
        items[itemIndex].url = gameId;
        items[itemIndex].isUniversal = isUniversal;
        items[itemIndex].script = document.getElementById('edit-script').value;
        items[itemIndex].image = e.target.result;
        
        localStorage.setItem('items', JSON.stringify(items));
        closeModal();
        displayItems();
    };
    reader.readAsDataURL(imageFile);
}

// Function to delete a script
function deleteScript(scriptId) {
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id.toString() === scriptId.toString());
    const deviceId = getDeviceId();
    const currentUser = localStorage.getItem('profileName');
    
    // Allow deletion if user is D3f4ult or is the original uploader
    if (!item || (item.uploader?.deviceId !== deviceId && currentUser !== "D3f4ult")) {
        console.log('Unauthorized delete attempt');
        return;
    }

    if (!confirm('Are you sure you want to delete this script?')) return;
    
    const newItems = items.filter(item => item.id.toString() !== scriptId.toString());
    
    // Save updated items
    localStorage.setItem('items', JSON.stringify(newItems));
    
    // Close modal and refresh display
    closeModal();
    displayItems();
}

// Function to close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Function to handle Go To Game click for universal scripts
function handleGoToGameClick(e, item) {
    if (item.isUniversal) {
        e.preventDefault();
        e.stopPropagation();
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.display = 'flex';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'universal-modal';
        modal.innerHTML = `
            <h3>Universal Script</h3>
            <p>This is a universal script that works across multiple Roblox games.</p>
            <button id="universal-ok">OK</button>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Handle OK button click
        document.getElementById('universal-ok').addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
        });
        
        // Close on outside click
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && document.body.contains(modalOverlay)) {
                document.body.removeChild(modalOverlay);
            }
        });
    } else {
        // For normal scripts, open the Roblox game URL
        window.open(getRobloxGameUrl(item.url), '_blank');
    }
} 