import { auth, db } from "./firebase.js";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
    addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// DOM Elements
const usersList = document.getElementById("usersList");
const coursesList = document.getElementById("coursesList");
const totalUsersEl = document.getElementById("totalUsers");
const totalCoursesEl = document.getElementById("totalCourses");

// Security Check: Redirect if not logged in
onAuthStateChanged(auth, (user) => {
    if (!user) window.location = "login.html";
});

async function loadDashboard() {
    // 1. Fetch Data
    const usersSnap = await getDocs(collection(db, "users"));
    const courseSnap = await getDocs(collection(db, "courses"));

    // Update Stats Counters
    totalUsersEl.innerText = usersSnap.size;
    totalCoursesEl.innerText = courseSnap.size;

    // 2. Clear Lists
    usersList.innerHTML = "";
    coursesList.innerHTML = "";

    // 3. Load Courses into list and store for dropdowns
    const courses = [];
    courseSnap.forEach(course => {
        const data = course.data();
        courses.push({ id: course.id, ...data });

        // Course Card UI
        coursesList.innerHTML += `
            <div class="flex justify-between items-center p-3 bg-gray-800/40 border border-gray-700 rounded-lg">
                <span class="font-medium text-cyan-400">${data.title}</span>
                <span class="text-xs text-gray-500 italic">Live</span>
            </div>
        `;
    });

    // 4. Load Users into Table
    usersSnap.forEach(user => {
        const data = user.data();
        
        // Create Table Row
        const row = document.createElement("tr");
        row.className = "border-b border-gray-800 hover:bg-white/5 transition";
        
        row.innerHTML = `
            <td class="p-4 font-medium">${data.name || 'Anonymous'}</td>
            <td class="p-4 text-gray-400">${data.email}</td>
            <td class="p-4">
                <select id="courseSelect-${user.id}" class="bg-gray-900 border border-gray-700 text-xs p-1 rounded focus:border-cyan-400 outline-none">
                    <option value="" disabled selected>Select Course</option>
                    ${courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                </select>
            </td>
            <td class="p-4">
                <button onclick="grantAccess('${user.id}')" class="bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-bold px-3 py-1 rounded transition uppercase">
                    Grant
                </button>
            </td>
        `;
        usersList.appendChild(row);
    });
}

// GRANT ACCESS FUNCTION
window.grantAccess = async (uid) => {
    const select = document.getElementById(`courseSelect-${uid}`);
    const courseId = select.value;

    if (!courseId) return alert("Please select a course first");

    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            purchasedCourses: arrayUnion(courseId)
        });
        alert("✅ Access Granted Successfully!");
    } catch (error) {
        console.error(error);
        alert("System Error: Failed to grant access.");
    }
};

// UPLOAD COURSE
document.getElementById("uploadBtn").onclick = async () => {
    const title = document.getElementById("title").value;
    const video = document.getElementById("video").value;

    if (!title || !video) return alert("Fill all fields");

    try {
        await addDoc(collection(db, "courses"), { title, video });
        alert("🚀 Course Deployed to Database");
        location.reload(); // Refresh to show new course
    } catch (error) {
        alert("Upload failed.");
    }
};

// LOGOUT
document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location = "login.html";
};

// INITIALIZE
loadDashboard();
