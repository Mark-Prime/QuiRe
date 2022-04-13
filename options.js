// Options page

function createElement(innerHTML, className) {
    let element = document.createElement('div');
    element.innerHTML = innerHTML

    if (className) {
        element.className = className;
    }

    return element;
}

function onEdit(isFolder, index, inFolder) {
    let editBar = document.getElementById('edit-bar')
    editBar.innerHTML = `<label for="edit-bar--title" class="label">Title</label>
    <input type="text" id="edit-bar--title" class="edit-bar--title">
    <label for="edit-bar--content" class="label">Content</label>
    <textarea rows="10" class="edit-bar--content" id="edit-bar--content"></textarea>
    <div class="btns">
        <button class="btn" id="save-btn">Save</button>
    </div>`

    let title = document.getElementById('edit-bar--title')
    let content = document.getElementById('edit-bar--content')

    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire

        if (inFolder) {
            title.value = quire[inFolder].contents[index].label
            content.value = quire[inFolder].contents[index].text
        } else if (isFolder) {
            title.value = quire[index].label
            content.disabled = true;
        } else {
            title.value = quire[index].label
            content.value = quire[index].text
        }
    })

    let saveBtn = document.getElementById('save-btn')
    saveBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['quire'], function(storage) {
            let quire = storage.quire

            if (inFolder) {
                quire[inFolder].contents[index].label = title.value
                quire[inFolder].contents[index].text = content.value
            } else if (isFolder) {
                quire[index].label = title.value
            } else {
                quire[index].label = title.value
                quire[index].text = content.value
            }

            chrome.storage.sync.set({'quire': quire}, function() {
                chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                    buildOptionsPage();
                    editBar.innerHTML = '';
                });
            })
        })
    })
}

function createFooter(isFolder, index, inFolder) {
    let btns = createElement('', 'btns');
    let editBtn = document.createElement('button');
    editBtn.innerHTML = 'Edit';

    editBtn.className = 'btn';
    editBtn.addEventListener('click', () => {
        onEdit(isFolder, index, inFolder)
    })

    let delBtn = document.createElement('button');

    delBtn.className = 'btn btn--del';
    delBtn.innerHTML = 'Delete';
    delBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['quire'], (storage) => {
            let quire = storage.quire

            if (inFolder === undefined) {
                quire.splice(index, 1)
            } else {
                quire[inFolder].contents.splice(index, 1)
            }

            chrome.storage.sync.set({'quire': quire}, function() {
                chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                    buildOptionsPage()
                });
            })
        })
    })

    btns.appendChild(delBtn);
    btns.appendChild(editBtn);

    if (isFolder) {
        let addBtn = document.createElement('button');
        addBtn.innerHTML = 'Add Item';
        addBtn.className = 'btn btn--add';

        addBtn.addEventListener('click', () => {
            chrome.storage.sync.get(['quire'], (storage) => {
                let quire = storage.quire
    
                quire[index].contents.push({
                    type: "text",
                    label: "New Item",
                    text: 'Default Text'
                })
    
                chrome.storage.sync.set({'quire': quire}, function() {
                    chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                        buildOptionsPage()
                    });
                })
            })
        })

        btns.appendChild(addBtn);
    }

    return btns
}

function createCard(element, index, inFolder) {
    let card = createElement('', 'card')
    card.id = element.id

    if (inFolder || index > 3) {
        card.appendChild(createElement(element.label, 'card--header'));
    } else {
        let header = createElement('', 'card--header');
        header.appendChild(createElement(element.label, 'card--title'));
        header.appendChild(createElement(`Hotkey: Shift+Alt+${index + 1}`, 'card--hotkey'));
        
        card.appendChild(header);
    }

    content = createElement(element.text, 'card--content')
    content.appendChild(createFooter(false, index, inFolder));
    card.appendChild(content);

    return card
}

function createFolder(element, index) {
    let folder = createElement('', 'card folder')
    folder.appendChild(createElement(element.label, 'card--header'));
    let folderContent = createElement('', 'folder--content');

    element.contents.forEach((content, itemindex) => {
        folderContent.appendChild(createCard(content, itemindex, index))
    })

    folder.appendChild(folderContent);
    folder.appendChild(createFooter(true, index));

    return folder
}

function isFolder(element) {
    return element.contents
}

function buildOptionsPage() {
    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire

        let cards = document.getElementById('cards')
        cards.innerHTML = ''

        quire.forEach((element, index) => {
            if (isFolder(element)) {
                cards.appendChild(createFolder(element, index))
            } else {
                cards.appendChild(createCard(element, index, undefined))
            }
        });

        let addFolderBtn = document.createElement('button');
        let addItemBtn = document.createElement('button');

        addFolderBtn.innerHTML = 'Add Folder';
        addFolderBtn.className = 'btn btn--add';

        addFolderBtn.addEventListener('click', () => {
            quire.push({
                type: 'folder',
                label: 'New Folder',
                contents: [
                    {
                        type: "text",
                        label: "New Text",
                        text: 'Default Text'
                    }
                ]
            })

            chrome.storage.sync.set({'quire': quire}, function() {
                chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                    buildOptionsPage()
                });
            })
        })

        addItemBtn.innerHTML = 'Add Item';
        addItemBtn.className = 'btn btn--add';

        addItemBtn.addEventListener('click', () => {
            let text = [];
            let folders = [];

            quire.forEach((element) => {
                if (element.type === 'text') {
                    text.push(element)
                } else {
                    folders.push(element)
                }
            })

            text.push({
                type: "text",
                label: "New Item",
                text: 'Default Text'
            })

            chrome.storage.sync.set({'quire': [...text, ...folders]}, function() {
                chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                    buildOptionsPage()
                });
            })
        })

        let btns = document.getElementById('add-items')
        btns.innerHTML = ''

        btns.appendChild(addFolderBtn);
        btns.appendChild(addItemBtn);
    })
}

buildOptionsPage()