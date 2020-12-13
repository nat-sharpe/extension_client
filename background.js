{
  const state = {
    staleItems: 0,
    freshItems: 0,
    maxAge: 3,
    hideStale: false,
    items: [],
    ages: {},
    on: true,
  };

  const decodeBase64 = rawCode => {
    // rawCode = civ3e
    const ebayBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-~";
    const answer = [];
    stringChars = rawCode.split(''); // ["c", "i", "v", "3", "e"]
    stringChars.forEach(char => {
      var value = ebayBase64.indexOf(char); // 28, 34, 47, 55, 30
      answer.push(value);
    });
    return answer; // [28, 34, 47, 55, 30]
  };
  
  const getTime = arr => {
    // arr = [28, 34, 47, 55, 30]
    const newArr = arr.map((column, index) => {
      // column = 28, 34, 47, 55, 30
      const power = arr.length - index - 1; 
      // power = 4, 3, 2, 1, 0
      const multiplier = index < arr.length ? Math.pow(64, power) : column;
      // multiplier = 16777216, 262144, 4096, 64, 1
      return column * multiplier;
    })
    // newArr = [469762048, 8912896, 192512, 3520, 30];
    let totalSeconds = 0;
    newArr.forEach(segment => {
      totalSeconds+= segment;
    })
    return totalSeconds; // 478,871,006
  
    // Note: actual Base64 encoding would turn 478871006 into "NDc4ODcxMDA2"
    // By using a base 64 numeral system, eBay can reduce that same number to just "civ3e"
  };					
  
  const calculateAge = timeCode => {
    const nowEpoch = Math.floor(Date.now() / 1000); // 1,572,580,928 (11/01/2019)
    const ebayEpoch = 1073741818; // The epoch time (seconds from 01/01/1970) when Ebay time began: ~ 01/10/2004 @ 1:36pm (UTC)
    const itemTime = getTime(timeCode); // The Ebay time when item's thumbnail image was uploaded: 478,871,006 seconds from 01/10/2004
    const itemEpoch = ebayEpoch + itemTime; // 1,073,741,818 + 478,871,006 = 1,552,612,824
  
    const ageInSeconds = nowEpoch - itemEpoch; // 1,572,580,928 - 1,552,612,824 = 19,968,104 seconds
    const ageInMinutes = ageInSeconds / 60; // 332,801 minutes
    const ageInHours = ageInMinutes / 60; // 5546 hours
    const ageInDays = ageInHours / 24; // 92 days
  
    const age = {
      minutes: Math.floor(ageInMinutes),
      hours: Math.floor(ageInHours),
      days: Math.floor(ageInDays),
      uploadDate: itemEpoch,
    }
    return age;
  };
  
  const translateDateCodes = minedItems => {
    const datedItems = {};
    Object.keys(minedItems).forEach(item => {
      if (minedItems[item].imgUrl) {
        const imgUrl = minedItems[item].imgUrl;
        // imgUrl = https://i.ebayimg.com/images/g/UrMAAOSwrYRciv3e/s-l1600.jpg
        const splitUrl = imgUrl.split('/');
        const beforeIndex = splitUrl.indexOf('g');
        const imageId = splitUrl.slice(beforeIndex+1, beforeIndex+2)[0];
        // imageId = UrMAAOSwrYRciv3e
        const base64Code = imageId.slice(imageId.length - 5, imageId.length);
        // base64Code = civ3e
        const timeCode = decodeBase64(base64Code);
        // timeCode = [28, 34, 47, 55, 30]
        const age = calculateAge(timeCode);
        // age = {
        //   minutes: 332801,
        //   hours: 5546,
        //   days: 92,
        //   uploadDate: 1552612824
        // }
        if (minedItems[item].soldDate) {
          const timeToSold = minedItems[item].soldDate - age.uploadDate;
          const daysToSold = timeToSold > 0 ? Math.floor(timeToSold / 86400) : 0;
          age.soldTime = daysToSold; 
        }
        datedItems[item] = age;
      } else {
        // if no image url
        datedItems[item] = {
          minutes: -1,
        }
      }
    });
    return datedItems;
  };

  const turnOn = () => {
    state.on = true;
    localStorage.setItem("FreshFinder", "on");
    showControls();
    start();
  };

  const turnOff = () => {
    state.on = false;
    state.staleItems = 0;
    state.freshItems = 0;
    localStorage.setItem("FreshFinder", "off");
    const srpMainContent = document.getElementsByClassName("srp-controls")[0];
    const dashBoard = document.getElementsByClassName("dashboard")[0];
    srpMainContent.removeChild(dashBoard);
    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (true) {
        item.style.display = "block";
        item.style.opacity = "1";
        const ageLabel = item.getElementsByClassName("age-label")[0];
        ageLabel ? item.removeChild(ageLabel) : null;
      }
    }
    
    start();
  };

  const showControls = () => {
    const controlPanel = document.createElement("div");
    controlPanel.className = "ff-control-panel"
    controlPanel.style.display = "flex"
    controlPanel.style.flexDirection = "column"
    controlPanel.style.justifyContent = "space-around"
    controlPanel.style.height = "77%"

    const resultsBox = document.createElement("div");
    resultsBox.className = "ff-results-box";
    resultsBox.innerText = "This page: "

    const fresh = document.createElement("span"); 
    fresh.className = "ff-fresh-items";
    fresh.style.color = "green";
    fresh.innerText = ` ${state.freshItems} fresh items `;

    const spacer = document.createElement("span"); 
    spacer.innerText = ` |  `;

    const stale = document.createElement("span");
    stale.className = "ff-stale-items";
    stale.style.color = "red";
    stale.innerText = ` ${state.staleItems} stale items `;

    resultsBox.appendChild(stale);
    resultsBox.appendChild(spacer);
    resultsBox.appendChild(fresh);


    const ageBox = document.createElement("div"); 
    const ageMessage = document.createElement("span"); 
    ageMessage.innerText = `Max age (days):  `;

    const ageInput = document.createElement("input"); 
    ageInput.type = "number";
    ageInput.value = `${state.maxAge}`;
    ageInput.style.width = "50px";
    ageInput.style.fontSize = "14px";
    ageInput.onchange = event => {
      const newMaxAge = parseInt(event.target.value);
      state.maxAge = newMaxAge;
      localStorage.setItem("maxAge", newMaxAge);
      updateStaleDisplay();
    };
    ageBox.appendChild(ageMessage);
    ageBox.appendChild(ageInput);

    staleBox = document.createElement("div");
    const staleMessage = document.createElement("span"); 
    staleMessage.innerText = `Stale item display: `;

    const fadeInput = document.createElement("input"); 
    fadeInput.type = "radio";
    fadeInput.name = "stale";
    fadeInput.value = "fade";
    if (!state.hideStale) {
      fadeInput.checked = true;
    }
    fadeInput.onchange = event => {
      const hideStale = event.target.value === "hide" ? true : false;
      state.hideStale = hideStale
      localStorage.setItem("staleDisplay", event.target.value);
      updateStaleDisplay();
    };
    const fadeMessage = document.createElement("span"); 
    fadeMessage.innerText = `Fade `;

    const hideInput = document.createElement("input"); 
    hideInput.type = "radio";
    hideInput.name = "stale";
    hideInput.value = "hide";
    if (state.hideStale) {
      hideInput.checked = true;
    }
    hideInput.onchange = event => {
      const hideStale = event.target.value === "hide" ? true : false;
      state.hideStale = hideStale
      localStorage.setItem("staleDisplay", event.target.value);
      updateStaleDisplay();
    };
    const hideMessage= document.createElement("span"); 
    hideMessage.innerText = `Hide `;

    staleBox.appendChild(staleMessage);
    staleBox.appendChild(fadeInput);
    staleBox.appendChild(fadeMessage);
    staleBox.appendChild(hideInput);
    staleBox.appendChild(hideMessage);

    const linkBox = document.createElement("div");
    linkBox.style.fontSize = "12px"
    linkBox.style.marginTop = "4px"
    const leaveReview = document.createElement("a");
    leaveReview.href = 'https://chrome.google.com/webstore/detail/fresh-finder-hide-re-list/jhjnmbngdjaholbfpbbofghbpfbeignc';
    leaveReview.innerText = "Leave Review";
    linkBox.appendChild(leaveReview);
    const spacer2 = document.createElement("span"); 
    spacer2.innerText = ` |  `;
    linkBox.appendChild(spacer2);
    const emailMe = document.createElement("a");
    emailMe.href = 'mailto:<nowiki>sharpe1890@gmail.com?subject=Question about Fresh Finder';
    emailMe.innerText = "Contact Us"
    linkBox.appendChild(emailMe);

    controlPanel.appendChild(resultsBox);
    controlPanel.appendChild(ageBox);
    controlPanel.appendChild(staleBox);
    controlPanel.appendChild(linkBox);

    const onOffButton = document.getElementsByClassName("ff-on-off")[0];
    onOffButton.innerText = "Turn Off";
    onOffButton.onclick = event => {
      event.preventDefault();
      turnOff();
    };
    const dashBoard = document.getElementsByClassName("dashboard")[0];
    dashBoard.style.height = "145px"
    dashBoard.appendChild(controlPanel);
  }

  const buildDashBoard = () => {
    const dashBoard = document.createElement("div");
    dashBoard.className = "dashboard"
    dashBoard.style.width = "400px"
    dashBoard.style.height = "40px";
    dashBoard.style.fontSize = "14px"
    dashBoard.style.display= "flex"
    dashBoard.style.flexDirection = "column"
    dashBoard.style.justifyContent = "space-between"
    dashBoard.style.margin = "10px 0px 10px 0px"
    dashBoard.style.padding = "5px 10px 12px 15px"
    dashBoard.style.border = "thin solid green"

    const headerBox = document.createElement("div");
    headerBox.className = "fresh-finder-headerBox";
    headerBox.style.display= "flex";
    headerBox.style.justifyContent = "space-between";
    headerBox.style.alignItems = "center";

    const title = document.createElement("h4"); 
    title.innerText = "Fresh Finder ☀️";
    title.className = "guaranteed-delivery__text";
    title.style.margin = "0";
    title.style.color = "green";

    const onOffButton = document.createElement("button");
    onOffButton.innerText = "Turn On";
    onOffButton.className = "ff-on-off"
    onOffButton.style.cursor = "pointer"
    onOffButton.style.cursor = "pointer"
    onOffButton.style.fontSize = "12px"
    onOffButton.style.height = "18px"
    onOffButton.onclick = event => {
      event.preventDefault();
      turnOn();
    };

    headerBox.appendChild(title);
    headerBox.appendChild(onOffButton);
    dashBoard.appendChild(headerBox);

    return dashBoard;
  };

  const updateDashBoard = () => {
    const fresh = document.getElementsByClassName("ff-fresh-items")[0];
    fresh.innerText = ` ${state.freshItems} fresh items `;
    const stale = document.getElementsByClassName("ff-stale-items")[0];
    stale.innerText = ` ${state.staleItems} stale items `;
  };

  updateStaleDisplay = () => {
    const items = state.items;
    const ages = state.ages;
    let newFreshItems = 0;
    let newStaleItems = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.getElementsByClassName("s-item__link")[0]) {
        try {
          const urlId = item.getElementsByClassName("s-item__link")[0].href;
          const age = ages[urlId];
          if (age.days > state.maxAge) {
            if (state.hideStale) {
              item.style.display = "none"; 
              item.style.opacity = "1";
            } else {
              item.style.display = "block"; 
              item.style.opacity = "0.35";
            }
            newStaleItems++;
          } else {
            item.style.display = "block"; 
            item.style.opacity = "1";
            newFreshItems++;
          }
        } catch(e) {
          console.log(e, item);
        }
      }
    }
    state.freshItems = newFreshItems;
    state.staleItems = newStaleItems;
    updateDashBoard();
  };

  const getAges = (minedItems) => {
    state.ages = translateDateCodes(minedItems);
    addAgesToItems();
  }

  const buildMinedItems = (items) => {
    const minedItems = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.getElementsByClassName("s-item__link")[0]) {
        try {
          const urlId = item.getElementsByClassName("s-item__link")[0].href;
          const firstImgUrl = item.getElementsByClassName("s-item__image-img")[0].src;
          const splitUrl = firstImgUrl.split('/');
          const format = splitUrl.slice(splitUrl.length - 1, splitUrl.length)[0].split('.').pop();
          let imgUrl = firstImgUrl;
          if (format !== "webp") {
            imgUrl = item.getElementsByClassName("s-item__image-img")[0].dataset.src;
          }
          // find sold date and add it to object as well.
          let soldDate = "";
          if (item.getElementsByClassName("POSITIVE")[0]) {
            try {
              const fullSoldDate = item.getElementsByClassName("POSITIVE")[0].innerText;
              const splitSoldDate = fullSoldDate.split("Sold ")[1];
              const epochSoldDate = Math.floor(new Date(splitSoldDate) / 1000);
              soldDate = epochSoldDate;
            } catch(e) {
              console.log(e, item);
            }
          }
          minedItems[urlId] = {imgUrl, soldDate}
        } catch(e) {
          console.log(e, item);
        }
      }
    }
    return minedItems;
  };

  const addAgesToItems = () => {
    const items = state.items;
    const ages = state.ages;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.getElementsByClassName("s-item__link")[0]) {
        try {
          const urlId = item.getElementsByClassName("s-item__link")[0].href;
          const age = ages[urlId];
          let message;
          if (age.days > 0) {
            message = age.days > 1 ? age.days + " days ago" : age.days + " day ago";
          } else if (age.hours > 0) {
            message = age.hours > 1 ? age.hours + " hours ago" : age.hours + " hour ago";
          } else if (age.minutes >= 0) {
            message = age.minutes > 1 ? age.minutes + " minutes ago" : age.minutes + " minute ago";
          } else {
            message = "Age unknown";
          }
          if (age.soldTime >= 0) {
            const soldText = age.soldTime === 1 ? "in 1 day)" : age.soldTime > 1 ? "in " + age.soldTime + " days)" : " same day)"
            message = message + " (sold " + soldText;
          }
          // const completedTime = item.getElementsByClassName("s-item__ended-date")[0].innerText;
          // const completedDateList = item.getElementsByClassName("s-gzosf5");
          // const completedYear = completedDateList[completedDateList.length - 1].innerText;
          const ageLabel = document.createElement("h3");
          ageLabel.innerText = message;
          ageLabel.className = "age-label";
          item.appendChild(ageLabel);
          if (age.days > state.maxAge) {
            if (state.hideStale) {
              item.style.display = "none"; 
              item.style.opacity = "1";
            } else {
              item.style.display = "block"; 
              item.style.opacity = "0.25";
            }
            state.staleItems++;
          } else {
            state.freshItems++;
          }
        } catch(e) {
          console.log(e, item);
        }
      }
    }
    updateDashBoard();
  }

  const start = () => {
    const srpMainContent = document.getElementsByClassName("srp-controls")[0];
    const dashBoardExists = document.getElementsByClassName("dashboard")[0];
    if (!dashBoardExists) {
      const dashBoard = buildDashBoard();
      srpMainContent.appendChild(dashBoard);
      const onStatus = localStorage.getItem("FreshFinder");
      state.maxAge = localStorage.getItem("maxAge") ? localStorage.getItem("maxAge") : state.maxAge;
      staleDisplay = localStorage.getItem("staleDisplay") ? localStorage.getItem("staleDisplay") : state.hideStale;
      state.hideStale = staleDisplay === "hide" ? true : false;
      if (onStatus === "on") {
        state.on = true;
        showControls();
      } else {
        state.on = false;
      }
    }
    if (state.on) {
      const items = document.getElementById("mainContent").getElementsByClassName("s-item   ");
      const minedItems = buildMinedItems(items);
      state.items = items;
      getAges(minedItems);
    }
  };
  start();
}