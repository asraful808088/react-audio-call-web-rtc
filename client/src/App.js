import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import { server } from "./config/config";

function App() {
  const [ringing, setRinging] = useState("ringing....");
  const [showRinging, setShowRinging] = useState(false);
  const [name, setName] = useState("simple audio call");
  const [activeUsers, setActiveUsers] = useState([]);
  const [redButton, setRedButton] = useState(false);
  const [greenButton, setgreenButton] = useState(false);
  const [navBarActive, setNavber] = useState(false);
  const [isMobileSide, setMobileSideStatus] = useState(false);
  const rtcConfig = useRef();
  const audio = useRef();
  useEffect(() => {
    checkWindowSize();
    window.addEventListener("resize", (e) => {
      checkWindowSize();
    });
  }, []);
  function checkWindowSize() {
    if (window.innerWidth > 800) {
      setMobileSideStatus(false);
    } else {
      setMobileSideStatus(true);
    }
  }
  useEffect(() => {
    const name = prompt("whats your name????(required)");
    if (name === "" || name === null) {
      window.location.reload();
    } else {
      rtcConfig.current = {};
      rtcConfig.current.myName = name;
      rtcConfig.current.busy = false;
      socketSetup(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function socketSetup(name) {
    const socket = io.connect(server);
    socket.on("offer", async (data) => {
      if (rtcConfig.current.busy) {
        socket.emit("busy", {
          to: data.other,
        });
      } else {
        const rtc = await rtcInit(data.other);
        setShowRinging(true);
        setRedButton(true);
        setgreenButton(true);
        rtcConfig.current.busy = true;
        rtc.setRemoteDescription(data.offer);
        setName(data.other);
        rtcConfig.current.other = data.other;
      }
    });
    socket.on("busy", (data) => {
      callEnd();
    });
    socket.on("end", (data) => {
      callEnd();
    });
    socket.on("ans", (data) => {
      setRinging("answered");
      rtcConfig.current.rtc.setRemoteDescription(data.ans);
      setShowRinging(true);
    });
    socket.on("candidate", (data) => {
      if (rtcConfig.current.rtc) {
        console.log("added");
        rtcConfig.current.rtc.addIceCandidate(data);
      }
    });
    socket.on("usedError", (err) => {
      alert(err);
      window.location.reload();
    });
    socket.on("newUser", (user) => {
      setActiveUsers((s) => [user, ...s]);
    });
    socket.on("successInit", (users) => {
      setActiveUsers([...users.allUsers]);
    });
    socket.on("removeUser", (user) => {
      if (user === rtcConfig.current.other) {
        callEnd();
      }
      const allusers = activeUsers;
      for (let index = 0; index < allusers.length; index++) {
        if (allusers[index] === user) {
          allusers.slice(index, 1);
        }
      }
      setActiveUsers(allusers);
    });
    socket.emit("init", name);
    rtcConfig.current.socket = socket;
  }
  function callEnd() {
    rtcConfig.current.audioStream = null;
    setShowRinging(false);
    setRedButton(false);
    setgreenButton(false);
    rtcConfig.current.busy = false;
    rtcConfig.current.rtc.close();
    rtcConfig.current.rtc = null;
    setRinging("ringing....");
    setName("simple audio call");
  }
  async function rtcInit(name) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    rtcConfig.current.audioStream = stream;
    const rtc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun2.l.google.com:19302" }],
    });
    rtcConfig.current.rtc = rtc;
    rtc.addStream(stream);
    rtc.onaddstream = (s) => {
      audio.current.srcObject = s.stream;
    };

    rtc.onicecandidate = (e) => {
      if (e.candidate === null) {
        return;
      }
      rtcConfig.current.socket.emit("candidate", {
        to: name,
        candidate: e.candidate,
      });
    };

    return rtc;
  }
  async function startCall(recName) {
    if (!rtcConfig.current.busy) {
      setRedButton(true);
      rtcConfig.current.other = recName;
      setName(recName);
      setShowRinging(true);
      rtcConfig.current.busy = true;
      const rtc = await rtcInit(recName);
      const offer = await rtc.createOffer();
      rtc.setLocalDescription(offer);
      rtcConfig.current.socket.emit("offer", {
        to: recName,
        offer: offer,
        from: rtcConfig.current.myName,
      });
    } else {
    }
  }
  async function ansCall() {
    setgreenButton(false);
    setRinging("answered");
    const ans = await rtcConfig.current.rtc.createAnswer();
    rtcConfig.current.rtc.setLocalDescription(ans);
    rtcConfig.current.socket.emit("ans", {
      to: rtcConfig.current.other,
      ans: ans,
    });
  }
  return (
    <div className="App">
      <div
        className="sub-box active"
        style={{
          transform: !isMobileSide
            ? "translateX(0px)"
            : navBarActive
            ? "translateX(0px)"
            : "translateX(-300px)",
        }}
      >
        <h1>
          active
          <div
            className="nav-button"
            onClick={() => {
              setNavber(false);
            }}
          >
            <img
              src={require("./assets/icon/icons8-cancel-40.png")}
              alt=""
              height={"100%"}
              width="100%"
            />
          </div>
        </h1>
        <div className="items">
          {activeUsers.map((data) => {
            return data !== rtcConfig.current.myName ? (
              <UserActiveItems
                key={data + Date.now()}
                name={data}
                onClick={(name) => {
                  startCall(name);
                }}
              />
            ) : null;
          })}
        </div>
      </div>
      <div className="sub-box call-box">
        <h1>
          <div
            className="nav-button"
            onClick={() => {
              setNavber(true);
            }}
          >
            <img
              src={require("./assets/icon/icons8-user-menu-male-40.png")}
              alt=""
              height={"100%"}
              width="100%"
            />
          </div>
          call
        </h1>
        <div className="call-container">
          <div className="header">
            <h1>{name}</h1>
            <h1
              className="ringing"
              style={{
                display: showRinging ? "block" : "none",
              }}
            >
              {ringing}
            </h1>
          </div>
          <div className="logo">
            <audio ref={audio} autoPlay></audio>
            <img
              src={require("./assets/icon/logo.png")}
              alt=""
              height="100%"
              width="100%"
            />
          </div>
          <div className="buttons">
            <div
              className="button"
              style={{
                display: redButton ? "flex" : "none",
              }}
              onClick={() => {
                rtcConfig.current.socket.emit("end", {
                  to: rtcConfig.current.other,
                });
                callEnd();
              }}
            >
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADIklEQVR4nO1ZTUsVURg+hkHgohaRQlgQVBQtDYMWF9rm5c7zTodArgkR1j5CaqPrWpYGUoT9ABd9EEQL+9hEy4qS1CKoqEAs6DbvueiJM/d6PdZVz8yd0Yp54MAw887zPs/5mPMxQmTIkCFDPQRS7lVE7xXwLiDaLf41KOCCItLVcn699QidyzVHiWdgcMGAuY6Uq69vo0gSyvPOMKAYuOtqJI4Bncs1M9E9k0sBpxsWbol5VBND1JOWASbqsd55KJKC6cNWf36uhWhK2oAWoslwpzJutJSbGZhdIC97XlfSBgKivNXK33WhsCUxA6EgoktWgsdJG2DgiRV/USSNH1JuZ4CtJj6clAEFHLJiValQaE/cQDXR9ZoB4FZSBpjotsV7TaQ5uzIwV+1G8wwcaNRA4Hn7apzAXCDlfpEmFNGY1Y1Gl40D+q1a7V+Bb9TiG0tNeC2h73e69NefRLsU0aQp5rpeTKlQaA8nrQUDvt8p1gJMNF4z4fvF2DzACevLNi7WCsr3O5joowJeaCnb4vJoKdsU8DLk8v2OZFVmyJDh/0dJyh0BkRfOusDN6ud1goEvTDQTztaVMmPuhc9MjIkFBgPPK6S27qkHPTCwoQwcYaIrCpi2ZtDGCjDNwGXDbXIkL7xYbFFE5xIVvbyZKUV01uRsXLgQTQycYqLPqQunpcXkZN8/6bL7qy8+n29l4MFaC1d/GrmvgW1xpvip9RavFsuk85LFDCIGnv0FovVvLfHUaYAz0fH1FquWKQFwzMXAnZg1VGaiocDzKPC8PWYM6d7eTWHJ51vNPfOMgWETG8sEVt7GVgwAn2IaGHLqo5UcwzFb4YNLC8zEIXc5K6p3BqSiVdLXVckV8CYG8bzu6trqasDEmndUdBMTqxtYusl27ZuvXMVbFfU6Rp4bqxIzIGPUzEhkA0QjkVsakE5n8+avSoTuU46zn1XAwYhfo7fO/yhCcuswd4UamWWibhETTNTNwDeXPJErqUS0s9rMk0wUmFYxayMmumpWi2XgaBIrRl0sthguw2m4w/WXyWVyVs6VRoyWRvNkyJAhg0gFvwATtYVwHyqNzwAAAABJRU5ErkJggg=="></img>
            </div>
            <div
              className="button"
              style={{
                display: greenButton ? "flex" : "none",
              }}
              onClick={() => {
                ansCall();
              }}
            >
              <img
                src={require("./assets/icon/pngwing.com.png")}
                alt={""}
                height="100%"
                width="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserActiveItems({ name = "no-name", onClick }) {
  const num = Math.floor(Math.random() * 14);
  return (
    <div className="users-active" onClick={() => onClick(name)}>
      <div className="icon">
        <img
          src={require(`./assets/icon/user (${num}).png`)}
          alt=""
          height="100%"
          width="100%"
        />
      </div>
      <div className="name">{name}</div>
    </div>
  );
}

export default App;
