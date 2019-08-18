{
  const getAges = (itemUrls, items, maxAge) => {
    const url = 'https://fervent-hamilton-b2d5b1.netlify.com/.netlify/functions/age';
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        var result = JSON.parse(xhr.responseText);		
        if (result) {
          const ages = result.datedItems;
          addAgesToItems(items, ages, maxAge);
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

  const addAgesToItems = (items, ages, maxAge) => {
    totalItems = items.length;
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
          if (age.days > maxAge) {
            item.style.display = "none";
            staleItems++;
          } else {
            freshItems++;
          }
        } catch(e) {
          console.log(e, item);
        }
      }
    }
    window.scroll(0,1);
    window.scroll(0,-1);
  }

  const start = () => {
    const items = document.getElementById("mainContent").getElementsByClassName("s-item   ");
    const maxAge = 3;
    const itemUrls = buildItemUrls(items, maxAge);
    getAges(itemUrls, items, maxAge)
  };

  start();
}