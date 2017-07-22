
var issClient: iss.Client = new iss.Client("kai4", null);
var issSocket: iss.Socket;

function onLayoutLoaded(msg: iss.LayoutLoadedMessage) {
    console.log("on layout loaded", msg);
}

function onLayoutWillLoad(layout: iss.Layout) {
    console.log("on layout will load", layout)
}

function onOSDDismissed() {
    console.log("on osd dismissed");
}

function onOSDPresented(name: iss.OSDScreen) {
    console.log("on osd presented");
}

function onWindowCreated(win: iss.Window) {
    console.log("onWindowCreated", win);
}

async function run() {
    iss.Sub("layout_loaded", onLayoutLoaded);
    iss.Sub("layout_will_load", onLayoutWillLoad);
    iss.Sub("osd_dismissed", onOSDDismissed);
    iss.Sub("osd_presented", onOSDPresented);
    iss.Sub("window_created", onWindowCreated);
    issSocket = await iss.createSocket("kai4");
    try {
        // await issClient.createWebWindow("https://arstechnica.com", null, null);
        // await issClient.showOSD("layouts_v2");
        // await issClient.dismissOSD();
        // await issClient.loadLayout(3);
    } catch (err) {
        console.log("error executing something", err);
        return;
    }
}

run();