{
  const state = {
    staleItems: 0,
    freshItems: 0,
    maxAge: 3,
    hideStale: false,
    items: [],
    ages: {},
  };

  const buildDashBoard = () => {
    const container = document.createElement("div");
    container.style.height = "145px"
    container.style.width = "350px"
    container.style.fontSize = "14px"
    container.style.display= "flex"
    container.style.flexDirection = "column"
    container.style.justifyContent = "space-between"
    container.style.margin = "10px 0px 10px 0px"
    container.style.padding = "10px 10px 12px 15px"
    container.style.border = "thin solid green"

    const title = document.createElement("h4"); 
    title.innerText = "Fresh Finder ☀️";
    title.className = "guaranteed-delivery__text";
    title.style.margin = "0";
    title.style.color = "green";


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
    stale.innerText = ` ${state.staleItems} stale items`;

    resultsBox.appendChild(fresh);
    resultsBox.appendChild(spacer);
    resultsBox.appendChild(stale);

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


    const emailBox = document.createElement("div");
    emailBox.style.fontSize = "12px"
    const emailMe = document.createElement("a");
    emailMe.href = 'mailto:<nowiki>sharpe1890@gmail.com?subject=Question about Fresh Finder';
    emailMe.innerText = "Contact Us"
    emailBox.appendChild(emailMe);

    container.appendChild(title);
    container.appendChild(resultsBox);
    container.appendChild(ageBox);
    container.appendChild(staleBox);
    container.appendChild(emailBox);
    return container;
  };

  const updateDashBoard = () => {
    const fresh = document.getElementsByClassName("ff-fresh-items")[0];
    fresh.innerText = ` ${state.freshItems} fresh items `;
    const stale = document.getElementsByClassName("ff-stale-items")[0];
    stale.innerText = ` ${state.staleItems} stale items`;
  };

  updateStaleDisplay = () => {
    const items = state.items;
    const ages = state.ages;
    let newFreshItems = 0;
    let newStaleItems = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id) {
        try {
          const urlId = item.getElementsByClassName("s-item__link")[0].href;
          const age = ages[urlId];
          if (age.days > state.maxAge) {
            if (state.hideStale) {
              item.style.display = "none"; 
              item.style.opacity = "1";
            } else {
              item.style.display = "block"; 
              item.style.opacity = "0.25";
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

  const getAges = (itemUrls) => {
    const url = 'https://truenew.netlify.com/.netlify/functions/age';
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        var result = JSON.parse(xhr.responseText);		
        if (result) {
          state.ages = result.datedItems;
          addAgesToItems();
        }
      }
    }
    xhr.send(JSON.stringify(itemUrls));
  }

  const buildItemUrls = (items) => {
    const itemUrls = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id) {
        try {
          const urlId = item.getElementsByClassName("s-item__link")[0].href;
          const firstImgUrl = item.getElementsByClassName("s-item__image-img")[0].src;
          const splitUrl = firstImgUrl.split('/');
          const format = splitUrl.slice(splitUrl.length - 1, splitUrl.length)[0].split('.').pop();
          let imgUrl = firstImgUrl;
          if (format !== "webp") {
            imgUrl = item.getElementsByClassName("s-item__image-img")[0].dataset.src;
          }
          itemUrls[urlId] = {imgUrl};
        } catch(e) {
          console.log(e, item);
        }
      }
    }
    return itemUrls;
  };

  const addAgesToItems = () => {
    const items = state.items;
    const ages = state.ages;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id) {
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
          const ageLabel = document.createElement("h3");
          ageLabel.innerText = message;
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
    // const resultsString = document.getElementsByClassName("srp-controls__count-heading")[0].innerText;
    // const resultsCount = resultsString.split(" ").includes("of") 
    //   ? resultsString.split("-")[1].split(" ")[0]
    //   : resultsString.split(" ")[0];
    // console.log(resultsCount);
    updateDashBoard();
    window.scroll(0,1);
    window.scroll(0,-1);
  }

  const start = () => {
    state.maxAge = localStorage.getItem("maxAge") ? localStorage.getItem("maxAge") : state.maxAge;
    staleDisplay = localStorage.getItem("staleDisplay") ? localStorage.getItem("staleDisplay") : state.hideStale;
    state.hideStale = staleDisplay === "hide" ? true : false;
    const items = document.getElementById("mainContent").getElementsByClassName("s-item   ");
    const srpMainContent = document.getElementsByClassName("srp-controls")[0];
    const dashBoard = buildDashBoard();
    srpMainContent.appendChild(dashBoard);
    const itemUrls = buildItemUrls(items);
    console.log(itemUrls);
    state.items = items;
    getAges(itemUrls)
  };

  start();
}