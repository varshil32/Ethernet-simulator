import React, { useState, useRef } from "react";
import axios from "axios";

import "./App.css";

const App = () => {
  const [currentSender, setCurrentSender] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageLog, setMessageLog] = useState([]);
  const packetRef = useRef(null);

  const totalComputers = 6;

  const logMessage = (msg) => {
    setMessageLog((prevLog) => [...prevLog, msg]);
  };

  const animatePacket = (sender, receiver) => {
    const computers = document.querySelectorAll(".computer");

    const start = computers[sender - 1].offsetLeft + computers[sender - 1].offsetWidth / 2;
    const end = computers[receiver - 1].offsetLeft + computers[receiver - 1].offsetWidth / 2;

    const packet = packetRef.current;
    let currentPosition = start;

    packet.style.display = "block";
    packet.style.left = `${start}px`;

    const movePacket = setInterval(() => {
      currentPosition += 10 * (start < end ? 1 : -1); 
      packet.style.left = `${currentPosition}px`;

      if ((start < end && currentPosition >= end) || (start > end && currentPosition <= end)) {
        clearInterval(movePacket);
        packet.style.display = "none";
      }
    }, 50); 
  };

  const handleComputerClick = async (computerId) => {
    if (!currentSender) {
      setCurrentSender(computerId);
      logMessage(`PC ${computerId} selected as sender.`);
    } else if (currentSender === computerId) {
      logMessage(`PC ${computerId} is already the sender.`);
    } else {
      if (!currentMessage.trim()) {
        logMessage("Error: Message cannot be empty. Please enter a message.");
        return;
      }
      logMessage(`PC ${computerId} selected as receiver. Starting transmission...`);
      
      try {
        const response = await axios.post("http://localhost:5000/api/communicate", {
          start: currentSender,
          end: computerId,
          msg: currentMessage.trim(),
        });
        logMessage(response.data.message);
        simulateTransmission(currentSender, computerId, currentMessage.trim(), response.data.backoffTimes);
        setCurrentSender(null);
      } catch (error) {
        logMessage("Error: " + error.response?.data?.message || "Unknown error");
      }
    }
  };

  const simulateTransmission = (sender, receiver, message, backoffTimes) => {
    logMessage("Dividing message into packets...");
    animatePacket(sender, receiver);

    setTimeout(() => {
      logMessage(`Packet from PC ${sender} successfully received by PC ${receiver}.`);
    }, 1000);

    if (backoffTimes) {
      logMessage("Collision detected. Waiting for backoff...");

      setTimeout(() => {
        logMessage(`Starting transmission from PC ${sender} to PC ${receiver} after ${backoffTimes.oldMessage}s delay.`);
        animatePacket(sender, receiver);
      }, backoffTimes.oldMessage * 1000);

      setTimeout(() => {
        logMessage(`Starting transmission from PC ${sender} to PC ${receiver} after ${backoffTimes.newMessage}s delay.`);
        animatePacket(sender, receiver);
      }, backoffTimes.newMessage * 1000);
    }
  };

  return (
    <div className="App">
      <div className="controls">
        <h1 className="title">Ethernet Simulator</h1>
        <textarea
          placeholder="Enter your message here..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          className="message-box"
        ></textarea>
        <button onClick={() => setMessageLog([])} className="clear-log">
          Clear Log
        </button>
      </div>

      <div className="bus">
        <div id="packet" ref={packetRef} className="packet">
          Pkt
        </div>
      </div>

      <div className="computers">
        {Array.from({ length: totalComputers }, (_, i) => (
          <div key={i + 1} className="computer-container">
            <img
              src="/assets/computer.png"
              alt={`Computer ${i + 1}`}
              className="computer"
              onClick={() => handleComputerClick(i + 1)}
            />
            <p className="computer-label">PC{i + 1}</p>
          </div>
        ))}
      </div>

      <div className="chatbox">
        {messageLog.map((entry, index) => (
          <div key={index}>{entry}</div>
        ))}
      </div>
    </div>
  );
};

export default App;
