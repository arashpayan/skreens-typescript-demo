namespace iss {
    // -- BEGIN pub/sub functionality
    export interface Subscription {
        (obj: any | null): void;
    }

    export type SubType = "audio_mixer_changed" | "audio_mixer_enabled_updated"
        | "closed_captioning_enabled_updated" | "closed_captions"
        | "hdmi_port_info_changed" | "hdmi_window_port_updated" | "layout_loaded"
        | "layout_will_load" | "osd_dismissed" | "osd_presented"
        | "window_created" | "window_destroyed" | "window_repositioned";

    export type OSDScreen = "enterprise_help" | "help" | "home" | "layouts"
        | "layouts_v2" | "menu" | "status" | "window_positions_status";

    interface Registry {
        [name: string]: Subscription[];
    }
    var registry: Registry = {};
    export function Pub(name: SubType, obj: any | null): void {
        if (!registry[name]) {
            return;
        }

        let subs = registry[name];
        subs.forEach(sub => {
            sub(obj);
        });
    }

    export function Sub(name: SubType, sub: Subscription): void {
        let subs = registry[name];
        if (!subs) {
            registry[name] = [sub];
        } else {
            subs.push(sub);
        }
    }
    // -- END pub/sub functionality

    export const AudioStreamMixed = 1000

    interface Background {
        type: string;
        address: string | null;
        rgb: string | null;
        image_file: string | null;
        image_style: string | null;
    }

    export interface Rect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export function Rect(x: number, y: number, width: number, height: number): Rect {
        return { x: x, y: y, width: width, height: height }
    }

    export function RectGetArea(r: Rect): number {
        return r.height * r.width;
    }

    interface Point {
        x: number;
        y: number;
    }

    export function RectGetCenter(r: Rect): Point {
        return {
            x: (r.x + r.x + r.width) / 2.0,
            y: (r.y + r.y + r.height) / 2.0
        }
    }

    export interface HDMIProperties {
        port: number;
        x_priority: number;
    }

    export interface WebProperties {
        url: string | null;
        title: string;
        is_loading: boolean;
        can_go_back: boolean;
        can_go_forward: boolean;
    }

    export interface Window {
        id: number;
        type: WindowType;
        position: Rect;
    }

    export interface WindowAnimation {
        window_id: number;
        end_position: Rect;
    }

    export interface HDMIWindow extends Window {
        hdmi_properties: HDMIProperties;
    }

    export interface WebWindow extends Window {
        web_properties: WebProperties;
    }

    export interface HDMIPort {
        port: number;
        device_name: string;
        in_use: boolean;
        has_signal: boolean;
        hdmi_device_id: number;
    }

    interface HDMIVideoMixingSettings {
        enabled: boolean
        transparency: number
        control_port: number
        x_chroma_key_source: number
        x_chroma_key_threshold: number
        x_chroma_key_adjustment: number
        x_ps_priority: number
    }

    export interface Layout {
        id: number
        name: string
        windows: Window[]
        background: Background
        audio_mixer_configuration: AudioConfiguration
        group: string
        is_default: boolean
        hdmi_video_mixing: HDMIVideoMixingSettings
    }

    interface KaiConfiguration {
        model: string;
        hdmi_port_count: number;
        serial_number: string;
        h264_enabled: boolean;
        audio_mixing_enabled: boolean;
        cec_enabled: boolean;
        virtual: boolean;
    }

    interface NetworkIPs {
        v4: string;
        v6: string;
    }

    interface SocketMessage {
        type: SocketMessageType;
        session_id: number;
    }

    interface BroadcastMessage extends SocketMessage {
        event: string
    }

    interface Capabilities {
        audio_mixer: boolean;
        rtp_streaming: boolean;
        cec: boolean;
        rtmp_broadcasting: boolean;
        cloud_connect: boolean;
        on_screen_display: boolean;
        broadcast_config_validation: boolean;
        note_boards: boolean;
        wide_screen_output: boolean;
        window_manager_modes: boolean;
        window_positions_osd: boolean;
        home_osd: boolean;
        layouts_v2_osd: boolean;
        bookmarks: boolean;
        closed_captioning: boolean;
    }

    export interface AudioConfiguration {
        hdmi_out_stream: number;
        hdmi_out_volume: number;
        hdmi_out_mute: boolean;
        mixed_ps_volume: number;
        mixed_ps_mute: boolean;
        mixed_microphone_volume: number;
        mixed_microphone_mute: boolean;
        mixed_hdmi_volumes: number[];
        mixed_hdmi_mutes: number[];
    }

    interface HelloMessage extends SocketMessage {
        windows: Window[];
        background: Background;
        hdmi_ports: HDMIPort[];
        kai_configuration: KaiConfiguration;
        device_name: string;
        ipv4_address: string;
        capabilities: Capabilities;
        audio_mixer_config: AudioConfiguration;
        audio_mixer_enabled: boolean;
    }

    interface AudioConfigChangedMessage extends BroadcastMessage {
        audio_mixer_configuration: AudioConfiguration;
    }

    interface ClosedCaptioningEnabledUpdatedMessage extends BroadcastMessage {
        closed_captions_enabled: boolean;
    }

    interface ClosedCaptionsMessage extends BroadcastMessage {
        closed_captions: string;
    }

    interface HDMIPortInfoChangedMessage extends BroadcastMessage {
        hdmi_port: HDMIPort;
    }

    interface HDMIWindowPortUpdatedMessage extends BroadcastMessage {
        window: HDMIWindow;
    }

    export interface LayoutLoadedMessage extends BroadcastMessage {
        layout_id: number;
        layout_name: string;
    }

    interface LayoutWillLoadMessage extends BroadcastMessage {
        layout: Layout;
    }

    interface OSDPresentedMessage extends BroadcastMessage {
        screen_name: OSDScreen;
    }

    interface WindowCreatedMessage extends BroadcastMessage {
        window: Window;
    }

    interface WindowDestroyedMessage extends BroadcastMessage {
        window_id: number;
    }

    interface WindowRepositionedMessage extends BroadcastMessage {
        window: Window;
    }

    type WindowType = "web" | "hdmi";
    type SocketMessageType = "broadcast" | "hello";

    function onSocketMessage(issSocket: Socket, evt: MessageEvent) {
        let msg = JSON.parse(evt.data) as SocketMessage;
        if (msg.type == "broadcast") {
            if (msg.session_id == issSocket.sessionId) {
                return;
            }
            switch ((msg as BroadcastMessage).event) {
                case "audio_mixer_changed":
                    Pub("audio_mixer_changed", (msg as AudioConfigChangedMessage).audio_mixer_configuration);
                    break;
                case "closed_captioning_enabled_updated":
                    Pub("closed_captioning_enabled_updated", (msg as ClosedCaptioningEnabledUpdatedMessage).closed_captions_enabled);
                    break
                case "closed_captions":
                    Pub("closed_captions", (msg as ClosedCaptionsMessage).closed_captions);
                    break;
                case "hdmi_port_info_changed":
                    Pub("hdmi_port_info_changed", (msg as HDMIPortInfoChangedMessage).hdmi_port);
                    break;
                case "hdmi_window_port_updated":
                    Pub("hdmi_window_port_updated", (msg as HDMIWindowPortUpdatedMessage).window);
                    break;
                case "layout_loaded":
                    Pub("layout_loaded", (msg as LayoutLoadedMessage));
                    break;
                case "layout_will_load":
                    Pub("layout_will_load", (msg as LayoutWillLoadMessage).layout);
                    break;
                case "osd_dismissed":
                    Pub("osd_dismissed", null);
                    break;
                case "osd_presented":
                    Pub("osd_presented", (msg as OSDPresentedMessage).screen_name);
                    break;
                case "window_created":
                    Pub("window_created", (msg as WindowCreatedMessage).window);
                    break;
                case "window_destroyed":
                    Pub("window_destroyed", (msg as WindowDestroyedMessage).window_id);
                    break;
                case "window_repositioned":
                    Pub("window_repositioned", (msg as WindowRepositionedMessage).window);
                    break;
            }
        }
    }

    function onSocketClose(issSocket: Socket, evt: CloseEvent) {
        console.log("ISSSocket.onClose", evt);
    }

    function onSocketError(issSocket: Socket, evt: ErrorEvent) {
        console.log("ISSSocket.onError", evt);
    }

    export class Socket {
        socket: WebSocket;
        sessionId: number;
        helloMessage: HelloMessage;

        osdFullScreenHdmi(port: number) {
            this.socket.send(JSON.stringify({
                command: "osd_full_screen_hdmi",
                hdmi_port: port
            }))
        }

        osdLoadLayout(layoutId: number) {
            this.socket.send(JSON.stringify({
                command: "osd_load_layout",
                layout_id: layoutId
            }));
        }

        repositionWindow(winId: number, pos: Rect) {
            this.socket.send(JSON.stringify({
                command: "reposition_window",
                window_id: winId,
                position: pos
            }));
        }

        updateHDMIWindowPort(winId: number, newPort: number) {
            this.socket.send(JSON.stringify({
                command: "update_hdmi_window_port",
                "window_id": winId,
                "hdmi_port": newPort
            }))
        }
    }

    export function createSocket(address: string): Promise<Socket> {
        return new Promise<Socket>((resolve, reject) => {
            let sock = new Socket();
            sock.socket = new WebSocket("ws://" + address + "/1/sockets");
            sock.socket.onopen = function (this: WebSocket, evt: Event) {
                // wait for the hello message
            };
            sock.socket.onerror = function (this: WebSocket, evt: ErrorEvent) {
                reject(evt);
            };
            sock.socket.onmessage = function (this: WebSocket, evt: MessageEvent) {
                let msg = JSON.parse(evt.data) as SocketMessage;
                if (msg.type != "hello") {
                    reject("First message over socket was not hello");
                    return;
                }

                sock.helloMessage = msg as HelloMessage;
                sock.sessionId = msg.session_id;
                sock.socket.onmessage = function (this: WebSocket, evt: MessageEvent) {
                    onSocketMessage(sock, evt);
                }
                sock.socket.onerror = function (this: WebSocket, evt: ErrorEvent) {
                    onSocketError(sock, evt);
                }
                resolve(sock);
            };
            sock.socket.onclose = function (this: WebSocket, evt: CloseEvent) {
                onSocketClose(sock, evt);
            };
        });
    }

    export class Client {
        address: string;
        clientType: string | null = null;
        constructor(addr: string, client: string | null) {
            this.address = addr;
            this.clientType = client;
        }

        animateWindows(animations: WindowAnimation[]): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    } else {
                        reject(new Error("invalid status code (" + req.status + ") when animating windows: " + req.response))
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
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

        createHDMIWindow(port: number, position: Rect, sessionId: number | null): Promise<HDMIWindow> {
            return new Promise<HDMIWindow>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let win = JSON.parse(req.response) as HDMIWindow;
                        resolve(win);
                    } else {
                        reject(new Error("invalid status code creating window: " + req.status));
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
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

        createWebWindow(url: string, position: Rect | null, sessionId: number | null): Promise<WebWindow> {
            return new Promise<WebWindow>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let win = JSON.parse(req.response) as WebWindow;
                        resolve(win);
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
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
                }
                if (position == null) {
                    win["position"] = position;
                }
                req.send(JSON.stringify(win));
            });
        }

        destroyWindow(winId: number): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    } else {
                        reject("failed to delete window: " + req.response);
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                req.open("DELETE", "http://" + this.address + "/1/windows/" + winId);
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }

        dismissOSD(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    } else {
                        reject("failed to dismiss window: " + req.response);
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                req.open("DELETE", "http://" + this.address + "/1/osd");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }

        editAudioConfig(hdmiOutStream: number | null,
            hdmiOutVolume: number | null,
            hdmiOutMute: boolean | null,
            mixedPsVolume: number | null,
            mixedPsMute: boolean | null,
            mixedMicVolume: number | null,
            mixedMicMute: boolean | null,
            mixedHDMIVolumes: number[] | null): Promise<AudioConfiguration> {
            return new Promise<AudioConfiguration>((resolve, reject) => {
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
                        resolve(ac as AudioConfiguration);
                    } else {
                        reject("editing audio config failed: " + req.response);
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject("net error failed to edit config: " + err);
                });
                req.open("PUT", "http://" + this.address + "/1/audio-config");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify(body));
            });
        }

        getCloudConnectInfo(): Promise<number> {
            return new Promise<number>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let obj = JSON.parse(req.response);
                        if (obj.user_id !== undefined) {
                            resolve(obj.user_id);
                        } else {
                            reject("response did not contain a user_id field");
                        }
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
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

        getLayouts(): Promise<Layout[]> {
            return new Promise<Layout[]>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let layouts = JSON.parse(req.response) as Layout[];
                        resolve(layouts);
                    } else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                req.open("GET", "http://" + this.address + "/1/layouts");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }

        loadLayout(layoutId: number): Promise<Layout> {
            return new Promise<Layout>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let layout = JSON.parse(req.response) as Layout;
                        resolve(layout);
                    } else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                let body = { id: layoutId }
                req.open("PUT", "http://" + this.address + "/1/window-manager/layout");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send(JSON.stringify(body));
            });
        }

        networkIPs(): Promise<NetworkIPs> {
            return new Promise<NetworkIPs>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        let ips = JSON.parse(req.response) as NetworkIPs;
                        resolve(ips);
                    } else {
                        reject("did not receive 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                req.open("GET", "http://" + this.address + "/1/device/network");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                req.send();
            });
        }

        showOSD(screenName: OSDScreen): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.addEventListener("load", function () {
                    if (req.status == 200) {
                        resolve();
                    } else {
                        reject("did not response 200 response. got " + req.status + " (" + req.response + ")");
                    }
                });
                req.addEventListener("error", function (err: ErrorEvent) {
                    reject(err);
                });
                req.open("POST", "http://" + this.address + "/1/osd");
                if (this.clientType != null) {
                    req.setRequestHeader("X-Client", this.clientType);
                }
                let body = { screen: screenName }
                req.send(JSON.stringify(body));
            });
        }
    }
}