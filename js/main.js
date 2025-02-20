let pages = [];

document.getElementById('pdfFiles').addEventListener('change', async function (event) {
    for (const file of event.target.files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;

            const imgSrc = canvas.toDataURL();
            const pageData = { file, pageIndex: i, imgSrc, rotation: 0 };
            pages.push(pageData);
        }
    }
    renderPages();
    enableDragAndDrop();
});

function renderPages() {
    const container = document.getElementById("pageContainer");
    container.innerHTML = "";
    pages.forEach((page, index) => {
        const pageDiv = document.createElement("div");
        pageDiv.classList.add("pdfPage");
        pageDiv.dataset.index = index;

        const img = document.createElement("img");
        img.src = page.imgSrc;
        img.style.transform = `rotate(${page.rotation}deg)`;

        const controls = document.createElement("div");
        controls.classList.add("controls");

        const rotateBtn = document.createElement("button");
        rotateBtn.textContent = "↻";
        rotateBtn.classList.add("btn", "rotate-btn");
        rotateBtn.onclick = () => rotatePage(index, img);

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "❌";
        removeBtn.classList.add("btn", "remove-btn");
        removeBtn.onclick = () => {
            pages.splice(index, 1);
            renderPages();
        };

        controls.appendChild(rotateBtn);
        controls.appendChild(removeBtn);
        pageDiv.appendChild(img);
        pageDiv.appendChild(controls);
        container.appendChild(pageDiv);
    });
}

function enableDragAndDrop() {
    new Sortable(document.getElementById("pageContainer"), {
        animation: 150,
        onEnd: function () {
            const reorderedPages = [];
            document.querySelectorAll(".pdfPage").forEach((div) => {
                reorderedPages.push(pages[parseInt(div.dataset.index)]);
            });
            pages = reorderedPages;
            renderPages();
        }
    });
}

function rotatePage(index, img) {
    pages[index].rotation = (pages[index].rotation + 90) % 360;
    img.style.transform = `rotate(${pages[index].rotation}deg)`;
}

async function mergePDFs() {
    if (pages.length < 1) {
        alert("No pages selected.");
        return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];
        const arrayBuffer = await pageData.file.arrayBuffer();
        const loadedPdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPage = await pdfDoc.copyPages(loadedPdf, [pageData.pageIndex]);

        copiedPage[0].setRotation(PDFLib.degrees(pageData.rotation));
        pdfDoc.addPage(copiedPage[0]);
    }

    const mergedPdfBytes = await pdfDoc.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download Merged PDF';
    downloadLink.click();

    setTimeout(resetApp, 1000);
}

function resetApp() {
    pages = [];
    document.getElementById("pageContainer").innerHTML = "";
    document.getElementById("pdfFiles").value = "";
    document.getElementById("downloadLink").style.display = "none";
    location.reload();
}
