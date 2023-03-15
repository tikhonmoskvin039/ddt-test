window.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const url =
    "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
  const token = "0942518e753e88745cd945cf0bd40269b0b9a937";

  let count = -1;
  let arrForRender = [];

  const searchInput = document.querySelector("#search");
  const shortNameInput = document.querySelector("#short-name");
  const fullNameInput = document.querySelector("#full-name");
  const innInput = document.querySelector("#inn");
  const addressInput = document.querySelector("#address");
  const wrap = document.querySelector("#wrap");
  const variantList = document.querySelector(".variant__list");
  const legal = document.querySelector(".organization__search");

  let daData = [];
  if (daData.length === 0) {
    searchInput.value = "";
    shortNameInput.value = "";
    fullNameInput.value = "";
    innInput.value = "";
    addressInput.value = "";
  }

  searchInput.addEventListener("input", async (event) => {
    count = -1;
    const { value } = event.target;
    await getData(value);

    if (value !== "") {
      renderVariantList(value);
      variantList.classList.remove("hidden");
    }

    if (value === "") {
      variantList.classList.add("hidden");
    }
  });

  searchInput.addEventListener("keydown", (event) => {
    const variantItems = document.querySelectorAll(".variant__item");
    const { key } = event;

    variantItems.forEach((item) => {
      item.classList.remove("variant__active");
    });
    if (key === "ArrowDown") {
      event.preventDefault();
      if (variantItems.length > 0) {
        count = count < 4 ? (count += 1) : 0;
        variantItems[count].classList.add("variant__active");
      }
    }
    if (key === "ArrowUp") {
      event.preventDefault();
      if (variantItems.length > 0) {
        count = count > 0 ? (count -= 1) : 4;
        variantItems[count].classList.add("variant__active");
      }
    }
    if (key === "Escape") {
      searchInput.value = "";
      variantList.classList.add("hidden");
    }
    if (key === "Tab") {
      variantList.classList.add("hidden");
    }
    if (key === "Enter") {
      if (count >= 0) {
        actionsForVariants(arrForRender[count]);
        count = 0;
      }
    }
  });

  window.addEventListener("click", (event) => {
    if (!wrap.contains(event.target)) variantList.classList.add("hidden");
  });

  searchInput.addEventListener("focus", () => {
    if (arrForRender.length > 0) variantList.classList.remove("hidden");
  });

  function renderVariantList(valueInput) {
    arrForRender = [];
    const list = document.querySelectorAll(".variant__item");
    list.forEach((item) => {
      item.remove();
    });

    if (daData.length > 0) {
      daData.forEach((item, index) => {
        if (index < 5) {
          arrForRender.push(item);
        }
      });
    }

    arrForRender.forEach((item, index) => {
      const { value, data } = item;
      let classTitle = "";
      if (item.data.state.status !== "ACTIVE") classTitle = "variant__title";

      if (index < 5) {
        const elem = document.createElement("div");
        elem.classList.add("variant__item");

        elem.innerHTML = `
                        <div class=${classTitle}>${markLetters(
          value,
          valueInput
        )}</div>
                        <div class="variant__description">
                            <p class="variant__inn">${markLetters(
                              data.inn,
                              valueInput
                            )}</p>
                            <p class="variant__own">${
                              data.address === null
                                ? ""
                                : markLetters(data.address.value, valueInput)
                            }</p>
                        </div>
                    `;
        elem.addEventListener("click", (event) => {
          actionsForVariants(item);
        });

        variantList.append(elem);
      }
    });
  }

  function actionsForVariants(item) {
    variantList.classList.add("hidden");
    const { value, data } = item;
    const removeLegal = document.querySelector(".organization__type");

    const legalType = document.createElement("div");
    if (removeLegal !== null) removeLegal.remove();

    legalType.classList = "organization__type";
    legalType.innerHTML = `<div>Организация (${data.type})</div>`;

    searchInput.value = value;
    legal.append(legalType);

    renderVariant(item);
  }

  function renderVariant(item) {
    const { value, data } = item;
    shortNameInput.value = value;
    fullNameInput.value = data.name.full_with_opf;
    innInput.value = `${data.inn} / ${data.kpp}`;
    addressInput.value = data.address.value;
  }

  function markLetters(str, valueInput) {
    const isIndexOf = str.toLowerCase().indexOf(valueInput.toLowerCase());

    if (isIndexOf >= 0) {
      return (
        str.slice(0, isIndexOf) +
        '<span class="variant__mark">' +
        str.slice(isIndexOf, isIndexOf + valueInput.length) +
        "</span>" +
        str.slice(isIndexOf + valueInput.length)
      );
    } else return str;
  }

  async function getIP() {
    let urlIp =
      "http://api.ipstack.com/check?access_key=93744030badf23ec17f6c5613a7da447";
    try {
      const response = await fetch(urlIp, {});

      if (!response.ok) {
        throw new Error("ServerError!");
      }

      const data = await response.json();

      localStorage.setItem("city", data.city);
      return true;
    } catch (error) {
      console.log(error.message);
    }
  }

  async function getData(query) {
    const city = "Moscow";
    try {
      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Token " + token,
        },
        body: JSON.stringify({ query: query }),
      });

      if (!response.ok) {
        throw new Error("ServerError!");
      }

      const data = await response.json();

      const withCity = data.suggestions.filter(
        (item) => item.data.address.data.city === "Москва"
      );
      const withoutCity = data.suggestions.filter(
        (item) => item.data.address.data.city !== "Москва"
      );
      const filterOnCity = [...withCity, ...withoutCity];

      if (city !== null) daData = filterOnCity;
      else daData = data.suggestions;
    } catch (error) {
      console.log(error.message);
    }
  }
});
