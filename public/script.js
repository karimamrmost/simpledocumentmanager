document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const accountTypeSelect = document.getElementById('account-type');
    const passwordInput = document.getElementById('password');
    const mainContent = document.getElementById('main-content');
    const paginationControls = document.getElementById('pagination-controls');
    const searchInput = document.getElementById('search-input');
    const fileList = document.getElementById('file-list');
    
    let userRole = '';
    let currentPage = 1;
    const itemsPerPage = 10;

    const roles = {
        admin: { canViewAll: true, canUpload: true, canDelete: true, canAddTabs: true },
        owner: { canViewAll: true, canUpload: false, canDelete: false, canAddTabs: false },
        IT: { canViewAll: false, canUpload: true, canDelete: false, canAddTabs: false },
        HR: { canViewAll: false, canUpload: true, canDelete: false, canAddTabs: false },
        Finance: { canViewAll: false, canUpload: true, canDelete: false, canAddTabs: false },
        Commercial: { canViewAll: false, canUpload: true, canDelete: false, canAddTabs: false },
        Warehouse: { canViewAll: false, canUpload: true, canDelete: false, canAddTabs: false }
    };

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const files = fileList.querySelectorAll('li');

        files.forEach(file => {
            const fileName = file.textContent.toLowerCase();
            if (fileName.includes(query)) {
                file.style.display = '';
            } else {
                file.style.display = 'none';
            }
        });
    });
    const login = () => {
        const accountType = accountTypeSelect.value;
        const password = passwordInput.value;
    
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: accountType, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                userRole = accountType;
                loginModal.style.display = 'none';
                mainContent.classList.remove('hidden');
                applyRolePermissions();
                
                // Set the default tab based on user role
                currentTab = userRole;  // Set currentTab to the role of the user
                loadFiles(currentTab, currentNestedTab);  // Load files for this role
                document.querySelector(`[data-tab="${currentTab}"]`).classList.add('active-tab');  // Activate the corresponding tab
                
                // No need to load PDF tabs or content separately as loadFiles handles it
            } else {
                alert('Incorrect password');
            }
        });
    };

    loginBtn.addEventListener('click', login);

    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            login();
        }
    });

    const applyRolePermissions = () => {
        const role = roles[userRole];

        if (!role.canAddTabs) {
            document.getElementById('add-tab-btn').style.display = 'none';
            document.getElementById('remove-tab-btn').style.display = 'none';
            document.getElementById('add-nested-tab-btn').style.display = 'none';
            document.getElementById('remove-nested-tab-btn').style.display = 'none';
        }

        if (!role.canUpload) {
            document.getElementById('upload-btn').style.display = 'none';
            document.getElementById('file-upload').style.display = 'none';
        }

        if (!role.canDelete) {
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        if (!role.canViewAll) {
            document.querySelectorAll('.tab-btn').forEach(tab => {
                if (tab.dataset.tab !== userRole) {
                    tab.disabled = true;
                }
            });
        }
    };

    const loadPDFs = () => {
        fetch('/get-pdfs')
        .then(response => response.json())
        .then(data => {
            displayPDFs(data);
            setupPagination(data.length);
        });
    };

    const displayPDFs = (pdfs) => {
        fileList.innerHTML = '';
    
        // Display all PDFs without pagination
        pdfs.forEach(pdf => {
            const li = document.createElement('li');
            li.textContent = pdf.name;
            fileList.appendChild(li);
        });
    };

/*     const setupPagination = (totalItems) => {
        paginationControls.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.addEventListener('click', () => {
                currentPage = i;
                loadPDFs();
            });
            if (i === currentPage) {
                button.disabled = true;
            }
            paginationControls.appendChild(button);
        }
    }; */

    const tabs = document.querySelectorAll('.tab-btn');
    const nestedTabsContainer = document.querySelector('.nested-tabs-container');
    const nestedTabs = document.querySelector('.nested-tabs');

    const pdfViewer = document.getElementById('pdf-viewer');
    const fileUpload = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const addTabBtn = document.getElementById('add-tab-btn');
    const removeTabBtn = document.getElementById('remove-tab-btn');
    const addNestedTabBtn = document.getElementById('add-nested-tab-btn');
    const removeNestedTabBtn = document.getElementById('remove-nested-tab-btn');
    let currentTab = 'IT';
    let currentNestedTab = 'annual';

    const loadFiles = (directory, subdirectory) => {
        fetch(`/files/${directory}/${subdirectory}`)
            .then(response => response.json())
            .then(files => {
                console.log(files); // Debugging line
                fileList.innerHTML = '';
    
                // Sort files by upload date in descending order
                files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
                if (files.length > 0) {
                    const mostRecentFile = files[0];
                    pdfViewer.src = `/uploads/${directory}/${subdirectory}/${mostRecentFile.name}`;
                }
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = `${file.name} (Uploaded on: ${new Date(file.uploadDate).toLocaleString()})`;
                    li.addEventListener('click', () => {
                        pdfViewer.src = `/uploads/${directory}/${subdirectory}/${file.name}`;
                    });
    
                    const deleteBtn = document.createElement('span');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.classList.add('delete-btn');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteFile(directory, subdirectory, file.name);
                    });
    
                    li.appendChild(deleteBtn);
                    fileList.appendChild(li);
                });
                applyRolePermissions(); // Apply permissions after loading files
            });
    };

    const deleteFile = (directory, subdirectory, filename) => {
        fetch(`/delete/${directory}/${subdirectory}/${filename}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('File deleted successfully');
                loadFiles(directory, subdirectory);
            } else {
                alert('File deletion failed: ' + data.message);
            }
        });
    };

    const addTab = () => {
        const newTabName = prompt('Enter the name of the new tab:');
        if (newTabName) {
            const newTab = document.createElement('button');
            newTab.classList.add('tab-btn');
            newTab.setAttribute('role', 'tab');
            newTab.setAttribute('aria-selected', 'false');
            newTab.setAttribute('data-tab', newTabName);
            newTab.textContent = newTabName;
            newTab.addEventListener('click', () => {
                currentTab = newTabName;
                loadFiles(currentTab, currentNestedTab);

                tabs.forEach(t => {
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('active-tab');
                });
                newTab.setAttribute('aria-selected', 'true');
                newTab.classList.add('active-tab');
            });
            document.querySelector('.tabs').appendChild(newTab);
        }
    };

    const removeTab = () => {
        const tabNameToRemove = prompt('Enter the name of the tab to remove:');
        if (tabNameToRemove) {
            const tabToRemove = document.querySelector(`.tab-btn[data-tab="${tabNameToRemove}"]`);
            if (tabToRemove) {
                tabToRemove.remove();
                if (currentTab === tabNameToRemove) {
                    currentTab = 'IT';
                    loadFiles(currentTab, currentNestedTab);
                    document.querySelector(`[data-tab="${currentTab}"]`).classList.add('active-tab');
                }
            } else {
                alert('Tab not found');
            }
        }
    };

    const addNestedTab = () => {
        const newNestedTabName = prompt('Enter the name of the new report type:');
        if (newNestedTabName) {
            const newNestedTab = document.createElement('button');
            newNestedTab.classList.add('nested-tab-btn');
            newNestedTab.setAttribute('role', 'tab');
            newNestedTab.setAttribute('aria-selected', 'false');
            newNestedTab.setAttribute('data-tab', newNestedTabName);
            newNestedTab.textContent = newNestedTabName;
            newNestedTab.addEventListener('click', () => {
                currentNestedTab = newNestedTabName;
                loadFiles(currentTab, currentNestedTab);

                nestedTabs.querySelectorAll('.nested-tab-btn').forEach(t => {
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('active-tab');
                });
                newNestedTab.setAttribute('aria-selected', 'true');
                newNestedTab.classList.add('active-tab');
            });
            nestedTabs.appendChild(newNestedTab);
        }
    };

    const removeNestedTab = () => {
        const nestedTabNameToRemove = prompt('Enter the name of the report type to remove:');
        if (nestedTabNameToRemove) {
            const nestedTabToRemove = document.querySelector(`.nested-tab-btn[data-tab="${nestedTabNameToRemove}"]`);
            if (nestedTabToRemove) {
                nestedTabToRemove.remove();
                if (currentNestedTab === nestedTabNameToRemove) {
                    currentNestedTab = 'annual';
                    loadFiles(currentTab, currentNestedTab);
                    document.querySelector(`[data-tab="${currentNestedTab}"]`).classList.add('active-tab');
                }
            } else {
                alert('Report type not found');
            }
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentTab = tab.getAttribute('data-tab');
            loadFiles(currentTab, currentNestedTab);

            tabs.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('active-tab');
            });
            tab.setAttribute('aria-selected', 'true');
            tab.classList.add('active-tab');
        });
    });

    nestedTabs.querySelectorAll('.nested-tab-btn').forEach(nestedTab => {
        nestedTab.addEventListener('click', () => {
            currentNestedTab = nestedTab.getAttribute('data-tab');
            loadFiles(currentTab, currentNestedTab);

            nestedTabs.querySelectorAll('.nested-tab-btn').forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('active-tab');
            });
            nestedTab.setAttribute('aria-selected', 'true');
            nestedTab.classList.add('active-tab');
        });
    });

    uploadBtn.addEventListener('click', () => {
        const file = fileUpload.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('directory', currentTab);
            formData.append('subdirectory', currentNestedTab);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('File uploaded successfully');
                    loadFiles(currentTab, currentNestedTab);
                } else {
                    alert('File upload failed: ' + data.message);
                }
            });
        }
    });

    addTabBtn.addEventListener('click', addTab);
    removeTabBtn.addEventListener('click', removeTab);
    addNestedTabBtn.addEventListener('click', addNestedTab);
    removeNestedTabBtn.addEventListener('click', removeNestedTab);

    loadFiles(currentTab, currentNestedTab);
    document.querySelector(`[data-tab="${currentTab}"]`).classList.add('active-tab');
    document.querySelector(`[data-tab="${currentNestedTab}"]`).classList.add('active-tab');
});


