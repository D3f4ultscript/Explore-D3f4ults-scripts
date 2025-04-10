// Admin key
const ADMIN_KEY = '123';

// Global variable to store current editing item
let currentEditingItem = null;

// Check admin key
function checkAdminKey() {
    const keyInput = document.getElementById('admin-key');
    const uploadForm = document.getElementById('upload-form');
    const adminAuth = document.getElementById('admin-auth');
    const adminItems = document.getElementById('admin-items');

    if (keyInput.value === ADMIN_KEY) {
        uploadForm.style.display = 'block';
        adminAuth.style.display = 'none';
        if (adminItems) {
            adminItems.style.display = 'block';
            displayAdminItems();
            
            // Set up admin search functionality
            const adminSearchInput = document.getElementById('admin-search-input');
            if (adminSearchInput) {
                adminSearchInput.addEventListener('input', function(e) {
                    displayAdminItems(e.target.value.toLowerCase());
                });
            }
        }
    } else {
        alert('Wrong admin key!');
    }
}

// Add HTML for modal to the document body
document.addEventListener('DOMContentLoaded', function() {
    // Create modal HTML
    const modalHTML = `
        <div id="edit-modal" class="modal-overlay" style="display: none;">
            <div class="modal">
                <h2>Edit Script</h2>
                <form id="edit-form">
                    <div class="form-group">
                        <label for="edit-name">Script Name (max 30 characters)</label>
                        <input type="text" id="edit-name" required class="modern-input" maxlength="30">
                    </div>
                    <div class="form-group">
                        <label for="edit-image">Preview Image</label>
                        <input type="file" id="edit-image" accept="image/*" class="modern-input">
                        <div class="current-image">
                            <p>Current Image:</p>
                            <img id="current-image-preview" src="" alt="Current Image" style="max-width: 200px; margin-top: 10px;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-url">Download URL</label>
                        <input type="url" id="edit-url" required class="modern-input">
                    </div>
                    <div class="form-group">
                        <label for="edit-script">Script Code</label>
                        <textarea id="edit-script" required class="modern-input" style="min-height: 150px;"></textarea>
                    </div>
                    <div class="button-container">
                        <button type="button" class="cancel-button" onclick="closeEditModal()">CANCEL</button>
                        <button type="submit" class="save-button">SAVE SCRIPT</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add submit event listener to the edit form
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEditedItem();
        });
    }

    const itemForm = document.getElementById('item-form');
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            displayItems(e.target.value.toLowerCase());
        });
    }

    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const imageFile = document.getElementById('image').files[0];
            const url = document.getElementById('url').value;
            const script = document.getElementById('script').value;

            if (!imageFile) {
                alert('Please select an image!');
                return;
            }

            // Convert image to base64
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create a new item object
                const item = {
                    id: Date.now(), // Unique ID for each item
                    name: name,
                    image: e.target.result, // Base64 image
                    url: url,
                    script: script,
                    date: new Date().toISOString()
                };

                // Save to localStorage
                let items = JSON.parse(localStorage.getItem('items') || '[]');
                items.push(item);
                localStorage.setItem('items', JSON.stringify(items));

                // Reset form
                itemForm.reset();
                alert('Item uploaded successfully!');
                
                // Update admin items display if visible
                if (document.getElementById('admin-items')) {
                    displayAdminItems();
                }
            };
            reader.readAsDataURL(imageFile);
        });
    }

    // Display items on home page
    displayItems();
});

// Display items on the home page
function displayItems(searchTerm = '') {
    const itemsContainer = document.getElementById('items-container');
    if (!itemsContainer) return;

    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
    itemsContainer.innerHTML = '';
    
    items
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            // Ensure name doesn't exceed 30 characters for display consistency
            const displayName = item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name;
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <img src="${item.image}" alt="${displayName}">
                <h3 title="${item.name}">${displayName}</h3>
                <div class="card-buttons">
                    <button class="url-button" onclick="window.open('${item.url}', '_blank')">GO TO URL</button>
                    <button class="script-button" data-script-id="${item.id}">COPY SCRIPT</button>
                </div>
            `;
            
            itemsContainer.appendChild(itemCard);
        });

    // Balance the grid with empty cards if less than 3 items
    const itemCount = items.filter(item => item.name.toLowerCase().includes(searchTerm)).length;
    if (itemCount > 0 && itemCount < 3) {
        const emptyCount = 3 - itemCount;
        for (let i = 0; i < emptyCount; i++) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'item-card empty';
            emptyCard.style.visibility = 'hidden';
            itemsContainer.appendChild(emptyCard);
        }
    }

    // Show message if no items found
    if (searchTerm && itemsContainer.children.length === 0) {
        itemsContainer.innerHTML = `
            <div class="no-results">
                <p>No scripts found matching "${searchTerm}"</p>
            </div>
        `;
    }
    
    // Add event listeners for script copy buttons
    document.querySelectorAll('.script-button').forEach(button => {
        button.addEventListener('click', function() {
            const scriptId = this.getAttribute('data-script-id');
            copyScript(scriptId);
        });
    });
}

// Display items in admin section
function displayAdminItems(searchTerm = '') {
    const adminItemsContainer = document.getElementById('admin-items-container');
    if (!adminItemsContainer) return;

    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
    adminItemsContainer.innerHTML = '';
    
    items
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            // Ensure name doesn't exceed 30 characters for display consistency
            const displayName = item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name;
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card admin-item';
            
            itemCard.innerHTML = `
                <img src="${item.image}" alt="${displayName}">
                <h3 title="${item.name}">${displayName}</h3>
                <p>Uploaded on: ${new Date(item.date).toLocaleDateString()}</p>
                <div class="card-buttons">
                    <button class="edit-button" onclick="editItem(${item.id})">EDIT</button>
                    <button class="delete-button" onclick="deleteItem(${item.id})">DELETE</button>
                </div>
            `;
            
            adminItemsContainer.appendChild(itemCard);
        });
        
    // Show message if no items found
    if (searchTerm && adminItemsContainer.children.length === 0) {
        adminItemsContainer.innerHTML = `
            <div class="no-results">
                <p>No scripts found matching "${searchTerm}"</p>
            </div>
        `;
    }
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        let items = JSON.parse(localStorage.getItem('items') || '[]');
        items = items.filter(item => item.id !== id);
        localStorage.setItem('items', JSON.stringify(items));
        
        // Update both displays
        displayItems();
        displayAdminItems();
    }
}

// Copy script to clipboard
function copyScript(scriptId) {
    // Get the script content from localStorage using the ID
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id === parseInt(scriptId));
    
    if (!item) {
        alert('Script not found!');
        return;
    }
    
    navigator.clipboard.writeText(item.script)
        .then(() => alert('Script copied to clipboard!'))
        .catch(err => alert('Error copying script: ' + err));
}

// Edit item function
function editItem(id) {
    // Get item from localStorage
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const item = items.find(item => item.id === id);
    
    if (!item) {
        alert('Item not found!');
        return;
    }
    
    // Store current item being edited
    currentEditingItem = item;
    
    // Populate form fields
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-url').value = item.url;
    document.getElementById('edit-script').value = item.script;
    document.getElementById('current-image-preview').src = item.image;
    
    // Show modal
    document.getElementById('edit-modal').style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditingItem = null;
}

// Save edited item
function saveEditedItem() {
    if (!currentEditingItem) {
        alert('No item being edited!');
        return;
    }
    
    // Get values from form
    const name = document.getElementById('edit-name').value;
    const url = document.getElementById('edit-url').value;
    const script = document.getElementById('edit-script').value;
    const imageFile = document.getElementById('edit-image').files[0];
    
    // Get all items from localStorage
    let items = JSON.parse(localStorage.getItem('items') || '[]');
    const itemIndex = items.findIndex(item => item.id === currentEditingItem.id);
    
    if (itemIndex === -1) {
        alert('Item not found!');
        return;
    }
    
    // If no new image is selected, just update other fields
    if (!imageFile) {
        items[itemIndex] = {
            ...currentEditingItem,
            name,
            url,
            script
        };
        
        // Save to localStorage
        localStorage.setItem('items', JSON.stringify(items));
        
        // Update displays
        displayItems();
        displayAdminItems();
        
        // Close modal
        closeEditModal();
        
        // Show confirmation
        alert('Item updated successfully!');
        return;
    }
    
    // If new image is selected, process it
    const reader = new FileReader();
    reader.onload = function(e) {
        items[itemIndex] = {
            ...currentEditingItem,
            name,
            url,
            script,
            image: e.target.result
        };
        
        // Save to localStorage
        localStorage.setItem('items', JSON.stringify(items));
        
        // Update displays
        displayItems();
        displayAdminItems();
        
        // Close modal
        closeEditModal();
        
        // Show confirmation
        alert('Item updated successfully!');
    };
    reader.readAsDataURL(imageFile);
} 