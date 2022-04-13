let quireDefaults = [
    {
        type: "text",
        label: "New Item",
        text: 'Default Text'
    },
    {
        type: "text",
        label: "New Item",
        text: 'Default Text'
    },
    {
        type: 'folder',
        label: 'Folder',
        contents: [
            {
                type: "text",
                label: "Text in a Folder",
                text: 'Text in a Folder'
            }
        ]
    }
];

// Run as soon as the plugin is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['quire'], function(storage) {
        if (storage.quire) {
            quireDefaults = storage.quire;
        }
        
        chrome.storage.sync.set({ "quire": quireDefaults });
    })
    console.log('Default Quire entries set in', quireDefaults);
}); // end onInstalled


// Clear the Quire context menu
function clearContextMenu() {
    chrome.contextMenus.removeAll();
} // end clearContextMenu

// add an item to the context menu
function addItemToContextMenu(entry, parentId, index) {
    let item = {
        id: `${parentId}-${index}`,
        title: entry.label,
        parentId,
        contexts: ['editable'],
    };
    chrome.contextMenus.create(item);
} // end addItemToContextMenu

function addFolderToContextMenu(entry, parentId, index) {
    if (entry.contents.length > 0)  {
        addItemToContextMenu(entry, parentId, index)

        entry.contents.forEach((content, contentIndex) => {
            addItemToContextMenu(content, `${parentId}-${index}`, contentIndex);
        })
    }
} // end addFolderToContextMenu

function onClicked(info) {
    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire;
        console.log("onClicked:", {info, quire});

        let Id = info.menuItemId;

        let splitId = Id.split('-');
        let text = '';

        if (splitId.length === 2) {
            console.log(quire[splitId[1]].text);
            text = quire[splitId[1]].text;
        } else {
            console.log(quire[splitId[1]].contents[splitId[2]].text);
            text = quire[splitId[1]].contents[splitId[2]].text;
        }

        document.activeElement.value += text;
    });
} // end onClicked

// Update the Quire context menu
function loadContextMenu(initialLoad) {
    clearContextMenu();

    let parentId = 'quire';

    let contextMenuItem = {
        id: parentId,
        title: 'QuiRe',
        contexts: ['editable']
    };

    chrome.contextMenus.create(contextMenuItem);

    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire

        quire.forEach((entry, index) => {
            if (entry.type === 'text') {
                addItemToContextMenu(entry, parentId, index);
            } else {
                addFolderToContextMenu(entry, parentId, index)
            }
        })
    })

    if (initialLoad) {
        let clickListener = async (info, tab) => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: onClicked,
                args: [info, tab],
            });
        }

        chrome.contextMenus.onClicked.addListener(clickListener);
    }

} // end loadContextMenu

function onHotKeyPressed(text) {
    document.activeElement.value += text;
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "RELOAD") {
        chrome.contextMenus.removeAll();
        loadContextMenu(false);
    }
})

chrome.commands.onCommand.addListener((command) => {
    console.log(`Command "${command}" triggered`);
    let hotkey = command.split('Hotkey')[1] - 1;

    chrome.storage.sync.get(['quire'], function(storage) {
        let quire = storage.quire;
        if (quire[hotkey] && quire[hotkey].type === 'text') {
            let text = quire[hotkey].text;
            console.log('text:', text);

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                let currTab = tabs[0];
                if (currTab) { 
                    chrome.scripting.executeScript({
                        target: {tabId: currTab.id},
                        func: onHotKeyPressed,
                        args: [text],
                    });
                }
            });
        }
    });
});


loadContextMenu(true)