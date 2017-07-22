var iss;
(function (iss) {
    var registry = {};
    function Pub(name, obj) {
        if (!registry[name]) {
            return;
        }
        let subs = registry[name];
        subs.forEach(sub => {
            sub(obj);
        });
    }
    iss.Pub = Pub;
    function Sub(name, sub) {
        let subs = registry[name];
        if (!subs) {
            registry[name] = [sub];
        }
        else {
            subs.push(sub);
        }
    }
    iss.Sub = Sub;
    // -- END pub/sub functionality
    iss.AudioStreamMixed = 1000;
    function Rect(x, y, width, height) {
        return { x: x, y: y, width: width, height: height };
    }
    iss.Rect = Rect;
    function RectGetArea(r) {
        return r.height * r.width;
    }
    iss.RectGetArea = RectGetArea;
    function RectGetCenter(r) {
        return {
            x: (r.x + r.x + r.width) / 2.0,
            y: (r.y + r.y + r.height) / 2.0
        };
    }
    iss.RectGetCenter = RectGetCenter;
    function onSocketMessage(issSocket, evt) {
        let msg = JSON.parse(evt.data);
        if (msg.type == "broadcast") {
            if (msg.session_id == issSocket.sessionId) {
                return;
            }
            switch (msg.event) {
                case "audio_mixer_changed":
                    Pub("audio_mixer_changed", msg.audio_mixer_configuration);
                    break;
                case "closed_captioning_enabled_updated":
                    Pub("closed_captioning_enabled_updated", msg.closed_captions_enabled);
                    break;
                case "closed_captions":
                    Pub("closed_captions", msg.closed_captions);
                    break;
                case "hdmi_port_info_changed":
                    Pub("hdmi_port_info_changed", msg.hdmi_port);
                    break;
                case "hdmi_window_port_updated":
                    Pub("hdmi_window_port_updated", msg.window);
                    break;
                case "layout_loaded":
                    Pub("layout_loaded", msg);
                    break;
                case "layout_will_load":
                    Pub("layout_will_load", msg.layout);
                    break;
                case "osd_dismissed":
                    Pub("osd_dismissed", null);
                    break;
                case "osd_presented":
                    Pub("osd_presented", msg.screen_name);
                    break;
                case "window_created":
                    Pub("window_created", msg.window);
                    break;
                case "window_destroyed":
                    Pub("window_destroyed", msg.window_id);
                    break;
                case "window_repositioned":
                    Pub("window_repositioned", msg.window);
                    break;
            }
        }
    }
    function onSocketClose(issSocket, evt) {
        console.log("ISSSocket.onClose", evt);
    }
    function onSocketError(issSocket, evt) {
        console.log("ISSSocket.onError", evt);
    }
    class Socket {
        osdFullScreenHdmi(port) {
            this.socket.send(JSON.stringify({
                command: "osd_full_screen_hdmi",
                hdmi_port: port
            }));
        }
        osdLoadLayout(layoutId) {
            this.socket.send(JSON.stringify({
                command: "osd_load_layout",
                layout_id: layoutId
            }));
        }
        repositionWindow(winId, pos) {
            this.socket.send(JSON.stringify({
                command: "reposition_window",
                window_id: winId,
                position: pos
            }));
        }
        updateHDMIWindowPort(winId, newPort) {
            this.socket.send(JSON.stringify({
                command: "update_hdmi_window_port",
                "window_id": winId,
                "hdmi_port": newPort
            }));
        }
    }
    iss.Socket = Socket;
    function createSocket(address) {
        return new Promise((resolve, reject) => {
            let sock = new Socket();
            sock.socket = new WebSocket("ws://" + address + "/1/sockets");
            sock.socket.onopen = function (evt) {
                // wait for the hello message
            };
            sock.socket.onerror = function (evt) {
                reject(evt);
            };
            sock.socket.onmessage = function (evt) {
                let msg = JSON.parse(evt.data);
                if (msg.type != "hello") {
                    reject("First message over socket was not hello");
                    return;
                }
                sock.helloMessage = msg;
                sock.sessionId = msg.session_id;
                sock.socket.onmessage = function (evt) {
                    onSocketMessage(sock, evt);
                };
                sock.socket.onerror = function (evt) {
                    onSocketError(sock, evt);
                };
                resolve(sock);
            };
            sock.socket.onclose = function (evt) {
                onSocketClose(sock, evt);
            };
        });
    }
    iss.createSocket = createSocket;
    class Client {
        constructor(addr, client) {
            this.clientType = null;
            this.address = addr;
            this.clientType = client;
        }
        animateWindows(animations) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    }
                    else {
                        reject(new Error("invalid status code (" + req.status + ") when animating windows: " + req.response));
                    }
                });
                req.addEventListener("error", function (err) {
                    console.log("net error animating windows:", err);
                    reject(err);
                });
                let url = "http://" + this.address + "/1/animations";
                req.open("POST", url);
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify(animations));
            });
        }
        createHDMIWindow(port, position, sessionId) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let win = JSON.parse(req.response);
                        resolve(win);
                    }
                    else {
                        reject(new Error("invalid status code creating window: " + req.status));
                    }
                });
                req.addEventListener("error", function (err) {
                    console.log("net error creating hdmi window:", err);
                    reject(err);
                });
                let url = "http://" + this.address + "/1/windows";
                if (sessionId != null) {
                    url += "?session_id=" + sessionId;
                }
                req.open("POST", url);
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify({
                    type: "hdmi",
                    hdmi_properties: {
                        port: port,
                    },
                    position: position
                }));
            });
        }
        createWebWindow(url, position, sessionId) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let win = JSON.parse(req.response);
                        resolve(win);
                    }
                });
                req.addEventListener("error", function (err) {
                    console.log("net error creating web window:", err);
                    reject(err);
                });
                let endpoint = "http://" + this.address + "/1/windows";
                if (sessionId != null) {
                    endpoint += "?session_id=" + sessionId;
                }
                req.open("POST", endpoint);
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                let win = {
                    type: "web",
                    web_properties: {
                        url: url,
                    }
                };
                if (position == null) {
                    win["position"] = position;
                }
                req.send(JSON.stringify(win));
            });
        }
        destroyWindow(winId) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    }
                    else {
                        reject("failed to delete window: " + req.response);
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                req.open("DELETE", "http://" + this.address + "/1/windows/" + winId);
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }
        dismissOSD() {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    }
                    else {
                        reject("failed to dismiss window: " + req.response);
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                req.open("DELETE", "http://" + this.address + "/1/osd");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }
        editAudioConfig(hdmiOutStream, hdmiOutVolume, hdmiOutMute, mixedPsVolume, mixedPsMute, mixedMicVolume, mixedMicMute, mixedHDMIVolumes) {
            return new Promise((resolve, reject) => {
                let body = {};
                if (hdmiOutStream != null) {
                    body["hdmi_out_stream"] = hdmiOutStream;
                }
                if (hdmiOutVolume != null) {
                    body["hdmi_out_volume"] = hdmiOutVolume;
                }
                if (hdmiOutMute != null) {
                    body["hdmi_out_mute"] = hdmiOutMute;
                }
                if (mixedPsVolume != null) {
                    body["mixed_ps_volume"] = mixedPsVolume;
                }
                if (mixedPsMute != null) {
                    body["mixed_ps_mute"] = mixedPsMute;
                }
                if (mixedMicVolume != null) {
                    body["mixed_mic_volume"] = mixedMicVolume;
                }
                if (mixedMicMute != null) {
                    body["mixed_mic_mute"] = mixedMicMute;
                }
                if (mixedHDMIVolumes != null) {
                    body["mixed_hdmi_volumes"] = mixedHDMIVolumes;
                }
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let ac = JSON.parse(req.response);
                        resolve(ac);
                    }
                    else {
                        reject("editing audio config failed: " + req.response);
                    }
                });
                req.addEventListener("error", function (err) {
                    reject("net error failed to edit config: " + err);
                });
                req.open("PUT", "http://" + this.address + "/1/audio-config");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify(body));
            });
        }
        getCloudConnectInfo() {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let obj = JSON.parse(req.response);
                        if (obj.user_id !== undefined) {
                            resolve(obj.user_id);
                        }
                        else {
                            reject("response did not contain a user_id field");
                        }
                    }
                });
                req.addEventListener("error", function (err) {
                    console.log("net error getting cloud connect info:", err);
                    reject(err);
                });
                req.open("GET", "http://" + this.address + "/1/device/cloud-connect-info");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }
        getLayouts() {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let layouts = JSON.parse(req.response);
                        resolve(layouts);
                    }
                    else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                req.open("GET", "http://" + this.address + "/1/layouts");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }
        loadLayout(layoutId) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let layout = JSON.parse(req.response);
                        resolve(layout);
                    }
                    else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                let body = { id: layoutId };
                req.open("PUT", "http://" + this.address + "/1/window-manager/layout");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify(body));
            });
        }
        networkIPs() {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let ips = JSON.parse(req.response);
                        resolve(ips);
                    }
                    else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                req.open("GET", "http://" + this.address + "/1/device/network");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }
        showOSD(screenName) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    }
                    else {
                        reject("did not response 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err) {
                    reject(err);
                });
                req.open("POST", "http://" + this.address + "/1/osd");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                let body = { screen: screenName };
                req.send(JSON.stringify(body));
            });
        }
    }
    iss.Client = Client;
})(iss || (iss = {}));
