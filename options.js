// Options page
const isSameElement = (element, otherElement) => (element.label === otherElement.label && element.text === otherElement.text)

const addClickListener = (elem, func, args = []) => (elem.addEventListener('click', () => {func(...args)}))

const isFolder = (element) => (element.contents)

function createElement(innerHTML, className, type='div') {
    let element = document.createElement(type);
    element.innerHTML = innerHTML

    if (className) {
        element.className = className;
    }

    return element;
}

function addFolder(quire) {
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
}

function addItem(quire) {
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
}

function deleteItem(index, inFolder) {
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
}

function addItemToFolder(index) {
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
}

function sortItems(parent, sortBtn) {
    if (parent.classList.contains('slist')) {
        sortBtn.innerHTML = 'SAVING...';
        unslist(parent);
    } else {
        sortBtn.innerHTML = 'Save';
        slist(parent);
    }
}

function importQuire() {
    let editBar = document.getElementById('edit-bar')
    editBar.classList.add('edit-bar--visible')
    editBar.innerHTML = `<label for="edit-bar--content" class="label">Import</label>
        <textarea rows="10" class="edit-bar--content" id="edit-bar--content"></textarea>
        <div class="btns">
            <button class="btn btn--del" id="cancel-btn">Cancel</button>
            <button class="btn" id="save-btn">Save</button>
        </div>`

    let saveBtn = document.getElementById('save-btn');
    let cancelBtn = document.getElementById('cancel-btn');

    addClickListener(saveBtn, saveImport,[editBar])
    addClickListener(cancelBtn, cancelImport,[editBar])
}

function exportQuire(quire) {
    let editBar = document.getElementById('edit-bar')
    editBar.classList.add('edit-bar--visible')
    editBar.innerHTML = `<textarea class="export-textarea">${JSON.stringify(quire)}</textarea>`;
}

function editSave(saveBtn, inFolder, isFolder, title, content, index) {
    saveBtn.innerHTML = 'SAVING...';
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
                let editBar = document.getElementById('edit-bar')
                editBar.innerHTML = '';
                editBar.classList.remove('edit-bar--visible')
            });
        })
    })
}

function saveImport(editBar) {
    let quire = JSON.parse(document.getElementById('edit-bar--content').value)

    chrome.storage.sync.set({'quire': quire}, function() {
        chrome.runtime.sendMessage({message: "RELOAD"}, function() {
            buildOptionsPage();
            editBar.innerHTML = '';
            editBar.classList.remove('edit-bar--visible')
        });
    });
}

function cancelImport(editBar) {
    editBar.innerHTML = '';
    editBar.classList.remove('edit-bar--visible')
}

function onEdit(isFolder, index, inFolder) {
    let editBar = document.getElementById('edit-bar')
    editBar.classList.add('edit-bar--visible')
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
    addClickListener(saveBtn, editSave, [saveBtn, inFolder, isFolder, title, content, index])
}

function createFooter(isFolder, index, inFolder, folder) {
    let btns                = createElement('', 'btns');
    let delBtn              = document.createElement('button');
    let editBtn             = document.createElement('button');

    delBtn.className        = 'btn btn--del';
    delBtn.innerHTML        = 'Delete';

    editBtn.innerHTML       = 'Edit';
    editBtn.className       = 'btn';

    addClickListener(delBtn, deleteItem, [index, inFolder])
    addClickListener(editBtn, onEdit, [isFolder, index, inFolder])

    btns.appendChild(delBtn);
    btns.appendChild(editBtn);

    if (isFolder) {
        let addBtn          = document.createElement('button');
        let sortBtn         = document.createElement('button');

        addBtn.innerHTML    = 'Add Item';
        addBtn.className    = 'btn btn--add';

        sortBtn.innerHTML   = 'Sort';
        sortBtn.className   = 'btn';

        addClickListener(addBtn, addItemToFolder, [index])
        addClickListener(sortBtn, sortItems, [folder, sortBtn])

        btns.appendChild(sortBtn);
        btns.appendChild(addBtn);
    }

    return btns
}

function createCard(element, index, inFolder, folderLabel) {
    let card    = createElement('', 'card', 'li');
    card.id     = `card-${index}`;

    if (inFolder) {
        card.id += `-${inFolder}`;
        card.dataset.folder = folderLabel;
    }

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

    card.dataset.label  = element.label;
    card.dataset.text   = element.text;

    return card
}

function createFolder(element, index) {
    let folder = createElement('', 'card folder')
    folder.appendChild(createElement(element.label, 'card--header', 'ul'));
    let folderContent = createElement('', 'folder--content');

    element.contents.forEach((content, itemindex) => {
        folderContent.appendChild(createCard(content, itemindex, index, element.label))
    })

    folder.appendChild(folderContent);
    folder.appendChild(createFooter(true, index, undefined, folderContent));

    return folder
}

function buildBtns(quire) {
    let btns = document.getElementById('add-items');
    btns.innerHTML = '';

    // While appreciated, the cascading nature of these variables is accidental.
    let addFolderBtn        = document.createElement('button');
    let addItemBtn          = document.createElement('button');
    let importBtn           = document.createElement('button');
    let exportBtn           = document.createElement('button');
    let sortBtn             = document.createElement('button');

    addFolderBtn.innerHTML  = 'Add Folder';
    addFolderBtn.className  = 'btn btn--add';

    addItemBtn.innerHTML    = 'Add Item';
    addItemBtn.className    = 'btn btn--add';

    importBtn.innerHTML     = 'Import JSON';
    importBtn.className     = 'btn';

    exportBtn.innerHTML     = 'Export JSON';
    exportBtn.className     = 'btn';

    sortBtn.innerHTML       = 'Sort';
    sortBtn.className       = 'btn';

    addClickListener(addFolderBtn, addFolder, [quire]);
    addClickListener(addItemBtn, addItem, [quire]);
    addClickListener(importBtn, importQuire);
    addClickListener(exportBtn, exportQuire, [quire]);
    addClickListener(sortBtn, sortItems, [cards, sortBtn]);

    btns.appendChild(addFolderBtn);
    btns.appendChild(addItemBtn);
    btns.appendChild(importBtn);
    btns.appendChild(exportBtn);
    btns.appendChild(sortBtn);
}

function unslist(target) {
    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire

        let items = target.getElementsByTagName("li");

        for (let index = 0; index < items.length; index++) {
            let item = items[index];
            id = item.id.split('-')

            if (id[2]) {
                if (quire[id[2]] && quire[id[2]].type === 'folder') {
                    if (quire[id[2]].contents[index] && !isSameElement(quire[id[2]].contents[index], item.dataset)) {
                        quire[id[2]].contents[index] = {
                            label: item.dataset.label,
                            text: item.dataset.text,
                            type: "text",
                        }
                    }
                }

                continue;
            }
            
            if (!isSameElement(quire[index], item.dataset)) {
                quire[index] = {
                    label: item.dataset.label,
                    text: item.dataset.text,
                    type: "text",
                }
            }
        }

        chrome.storage.sync.set({'quire': quire}, function() {
            chrome.runtime.sendMessage({message: "RELOAD"}, function() {
                buildOptionsPage();
                target.classList.remove("slist");
            });
        })
    })
}

function slist(target) {
    // (A) SET CSS + GET ALL LIST ITEMS
    target.classList.add("slist");
    let items = target.getElementsByTagName("li"), current = null;

    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    for (let i of items) {
        // (B1) ATTACH DRAGGABLE
        i.draggable = true;
        
        // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
        i.ondragstart = (ev) => {
            current = i;
            for (let it of items) {
                if (it != current) { it.classList.add("hint"); }
            }
        };
        
        // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
        i.ondragenter = (ev) => {
            if (i != current) { i.classList.add("active"); }
        };

        // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
        i.ondragleave = () => {
            i.classList.remove("active");
        };

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.ondragend = () => { for (let it of items) {
            it.classList.remove("hint");
            it.classList.remove("active");
        }};

        // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
        i.ondragover = (evt) => { evt.preventDefault(); };

        // (B7) ON DROP - DO SOMETHING
        i.ondrop = (evt) => {
            evt.preventDefault();
            if (i != current) {
                let currentpos = 0, droppedpos = 0;
                for (let it=0; it<items.length; it++) {
                    if (current == items[it]) { currentpos = it; }
                    if (i == items[it]) { droppedpos = it; }
                }
                if (currentpos < droppedpos) {
                    i.parentNode.insertBefore(current, i.nextSibling);
                } else {
                    i.parentNode.insertBefore(current, i);
                }
            }
        };
    }
}

function buildOptionsPage() {
    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire

        let cards = document.getElementById('cards')
        cards.innerHTML = ''

        for (let index = 0; index < quire.length; index++) {
            const element = quire[index];
            if (isFolder(element)) {
                cards.appendChild(createFolder(element, index))
                continue
            }

            cards.appendChild(createCard(element, index, undefined))
        }

        buildBtns(quire)
    })
}

window.onload = () => {
    buildOptionsPage()
};