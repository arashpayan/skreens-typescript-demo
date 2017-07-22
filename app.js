var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var issClient = new iss.Client("kai4", null);
var issSocket;
function onLayoutLoaded(msg) {
    console.log("on layout loaded", msg);
}
function onLayoutWillLoad(layout) {
    console.log("on layout will load", layout);
}
function onOSDDismissed() {
    console.log("on osd dismissed");
}
function onOSDPresented(name) {
    console.log("on osd presented");
}
function onWindowCreated(win) {
    console.log("onWindowCreated", win);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        iss.Sub("layout_loaded", onLayoutLoaded);
        iss.Sub("layout_will_load", onLayoutWillLoad);
        iss.Sub("osd_dismissed", onOSDDismissed);
        iss.Sub("osd_presented", onOSDPresented);
        iss.Sub("window_created", onWindowCreated);
        issSocket = yield iss.createSocket("kai4");
        try {
            // await issClient.createWebWindow("https://arstechnica.com", null, null);
            // await issClient.showOSD("layouts_v2");
            // await issClient.dismissOSD();
            // await issClient.loadLayout(3);
        }
        catch (err) {
            console.log("error executing something", err);
            return;
        }
    });
}
run();
