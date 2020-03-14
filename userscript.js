// ==UserScript==
// @name         NovelUpdates userscript
// @version      0.1
// @author       telaak
// @match        https://www.novelupdates.com/
// ==/UserScript==

const releases = document.querySelectorAll(".l-content.release")[0];
const pagination = document.querySelectorAll(".digg_pagination")[0];
pagination.style = "display: none";
const parser = new DOMParser();
let ticking = false;
let pageNumber = 1;

const addRowToggle = row => {
  let tableRow = document.createElement("tr");
  let tableCell = document.createElement("td");
  row.onclick = e => {
    let parent = e.target.parentNode;
    if (parent.nodeName !== "TR") return;
    let nextRow = parent.nextElementSibling;
    if (!row.getAttribute("extra-toggle")) {
      row.setAttribute("extra-toggle", "visible");
      fetch(parent.firstElementChild.children[1].href)
        .then(res => res.text())
        .then(html => {
          let doc = parser.parseFromString(html, "text/html");
          let content = doc.querySelector(".g-cols.wpb_row");
          tableCell.setAttribute("colspan", "3");
          tableCell.appendChild(content);
          tableRow.appendChild(tableCell);
          parent.parentNode.insertBefore(tableRow, nextRow);
        });
    } else if (row.getAttribute("extra-toggle") === "visible") {
      tableRow.style = "display: none";
      row.setAttribute("extra-toggle", "hidden");
    } else {
      tableRow.style = "";
      row.setAttribute("extra-toggle", "visible");
    }
  };
};

const filterTable = table => {
  for (const row of table.children[1].children) {
    if (row.children[0].children[0].className !== "orgjp") {
      row.style = "display: none";
    } else {
      addRowToggle(row);
    }
  }
};

const buildTables = doc => {
  for (const table of doc.querySelectorAll(".tablesorter")) {
    filterTable(table);
    const bodyTables = document.querySelectorAll(".tablesorter");
    const lastTable = bodyTables[bodyTables.length - 1];
    if (
      lastTable.previousElementSibling.textContent ===
      table.previousElementSibling.textContent
    ) {
      [...table.children[1].children].forEach(row =>
        lastTable.children[1].appendChild(row)
      );
    } else {
      releases.appendChild(document.createElement("br"));
      releases.appendChild(table.previousElementSibling);
      releases.appendChild(table);
    }
  }
};

const fetchPage = number =>
  fetch(`/?pg=${number}`)
    .then(res => res.text())
    .then(html => parser.parseFromString(html, "text/html"));

buildTables(document);
window.addEventListener("scroll", async e => {
  if (
    !ticking &&
    document.body.clientHeight - window.scrollY <= window.innerHeight + 40
  ) {
    ticking = true;
    await Promise.all(
      Array.from({ length: 5 }).map(() => fetchPage(++pageNumber))
    ).then(pages => pages.forEach(page => buildTables(page)));
    ticking = false;
  }
});
