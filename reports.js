// ======================================
// REPORT CHART
// ======================================
if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const reportChart = document.getElementById("reportChart");

if (reportChart) {

    new Chart(reportChart, {

        type: "line",

        data: {

            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun"
            ],

            datasets: [{

                label: "Reports Generated",

                data: [5, 7, 6, 8, 10, 12],

                borderColor: "#06b6d4",

                backgroundColor: "rgba(6,182,212,0.2)",

                fill: true,

                tension: 0.4

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: true

                }

            }

        }

    });

}



// ======================================
// DOWNLOAD BUTTONS
// ======================================

const pdfBtn = document.querySelector(".pdf-btn");
const csvBtn = document.querySelector(".csv-btn");

if(pdfBtn){

    pdfBtn.addEventListener("click",()=>{

        alert("PDF Download will be available after Backend Integration.");

    });

}

if(csvBtn){

    csvBtn.addEventListener("click",()=>{

        alert("CSV Download will be available after Backend Integration.");

    });

}



// ======================================
// CARD ANIMATION
// ======================================

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-8px)";
        card.style.transition=".3s";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});



// ======================================
// TABLE HOVER EFFECT
// ======================================

const rows=document.querySelectorAll("table tr");

rows.forEach((row,index)=>{

    if(index!==0){

        row.addEventListener("mouseenter",()=>{

            row.style.background="#ecfeff";

        });

        row.addEventListener("mouseleave",()=>{

            row.style.background="white";

        });

    }

});



// ======================================
// STATUS COLORS
// ======================================

const status=document.querySelectorAll("table td:last-child");

status.forEach(item=>{

    const text=item.innerText.toLowerCase();

    if(text.includes("completed")){

        item.style.color="green";
        item.style.fontWeight="bold";

    }

    else if(text.includes("processing")){

        item.style.color="orange";
        item.style.fontWeight="bold";

    }

});



// ======================================
// CARD FADE-IN
// ======================================

const numbers=document.querySelectorAll(".card h2");

numbers.forEach(number=>{

    number.style.opacity="0";

    setTimeout(()=>{

        number.style.opacity="1";
        number.style.transition="1s";

    },500);

});



// ======================================
// SIDEBAR ACTIVE
// ======================================

const menu=document.querySelectorAll(".sidebar ul li");

menu.forEach(item=>{

    item.addEventListener("click",()=>{

        menu.forEach(i=>{

            i.classList.remove("active");

        });

        item.classList.add("active");

    });

});



// ======================================
// PAGE LOAD
// ======================================

window.onload=function(){

    console.log("Reports Module Loaded Successfully");

};



// ======================================
// AUTO NOTIFICATION
// ======================================

setTimeout(()=>{

    console.log("📄 Monthly ESG Report Ready");

},3000);



// ======================================
// SCROLL EVENT
// ======================================

window.addEventListener("scroll",()=>{

    if(window.scrollY>300){

        console.log("Viewing Reports...");

    }

});