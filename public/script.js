// script.js
const pdfViewer = document.getElementById("pdfViewer");
const pageNumDisplay = document.getElementById("currentPage");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");

let pdfDoc = null;
let currentPage = 1;
let totalPageCount = 0;
let ws;
let isAdmin = confirm("Are you the presenter? Click 'OK' if yes.");

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

// Load the PDF file
pdfjsLib.getDocument("sample.pdf").promise.then((doc) => {
    pdfDoc = doc;
    totalPageCount = pdfDoc.numPages;
    renderPage(currentPage);
    setupWebSocket();
});

function renderPage(pageNum) {
    pdfDoc.getPage(pageNum).then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        pdfViewer.innerHTML = "";  // Clear previous page
        pdfViewer.appendChild(canvas);
        
        page.render({ canvasContext: context, viewport: viewport });
        pageNumDisplay.textContent = pageNum;
    });
}

function setupWebSocket() {
    ws = new WebSocket("ws://localhost:3000");
    
    ws.onopen = () => {
        if (isAdmin) {
            ws.send(JSON.stringify({ type: "admin" }));
        }
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "syncPage" && !isAdmin) {
            currentPage = data.page;
            renderPage(currentPage);
        }
    };
}

prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
        if (isAdmin) {
            ws.send(JSON.stringify({ type: "changePage", page: currentPage }));
        }
    }
});

nextPageButton.addEventListener("click", () => {
    if (currentPage < totalPageCount) {
        currentPage++;
        renderPage(currentPage);
        if (isAdmin) {
            ws.send(JSON.stringify({ type: "changePage", page: currentPage }));
        }
    }
});
