// ============================================
// demo.js — Demo chat animation (Civik-ia site)
// Depends on: data.js (solutionConversations, demoConversations)
// ============================================

function typeText(element, text, speed = 18) {
    return new Promise(resolve => {
        let i = 0;
        let lastTime = 0;
        element.textContent = '';
        function tick(timestamp) {
            if (timestamp - lastTime >= speed) {
                i++;
                element.textContent = text.slice(0, i);
                lastTime = timestamp;
            }
            if (i < text.length) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });
}

function showTypingIndicator(container) {
    const dots = document.createElement('div');
    dots.className = 'demo-message bot typing-indicator';
    dots.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    container.appendChild(dots);
    container.scrollTop = container.scrollHeight;
    return dots;
}

let solutionChatCycles = 0;
let solutionChatRunning = false;

async function animateSolutionChat() {
    const solutionChat = document.getElementById('solutionChat');
    if (!solutionChat || solutionChatRunning) return;
    solutionChatRunning = true;
    solutionChat.innerHTML = '';

    for (const msg of solutionConversations) {
        await new Promise(r => setTimeout(r, 800));
        const userDiv = document.createElement('div');
        userDiv.className = 'demo-message user';
        userDiv.textContent = msg.user;
        solutionChat.appendChild(userDiv);
        solutionChat.scrollTop = solutionChat.scrollHeight;

        await new Promise(r => setTimeout(r, 400));
        const dots = showTypingIndicator(solutionChat);

        await new Promise(r => setTimeout(r, 800));
        dots.remove();
        const botDiv = document.createElement('div');
        botDiv.className = 'demo-message bot';
        solutionChat.appendChild(botDiv);
        await typeText(botDiv, msg.bot, 16);
        solutionChat.scrollTop = solutionChat.scrollHeight;

        await new Promise(r => setTimeout(r, 600));
    }

    solutionChatRunning = false;
    solutionChatCycles++;
    // Max 2 cycles then stop
    if (solutionChatCycles < 2) {
        setTimeout(() => animateSolutionChat(), 4000);
    }
}

function initializeDemo() {
    // Start animated solution chat only when section is visible
    const solutionSection = document.getElementById('solution');
    if (solutionSection) {
        const solutionObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && solutionChatCycles < 2) {
                    animateSolutionChat();
                }
                // Don't abort on leave — let current animation complete
            });
        }, { threshold: 0.1 });
        solutionObs.observe(solutionSection);
    }

    // Populate demo section with initial conversation
    const demoChat = document.getElementById('demoChat');
    if (demoChat) {
        function displayMessages(messages) {
            demoChat.innerHTML = '';
            messages.forEach((msg, idx) => {
                setTimeout(() => {
                    const div = document.createElement('div');
                    div.className = `demo-message ${msg.user ? 'user' : 'bot'}`;
                    div.textContent = msg.user || msg.bot;
                    demoChat.appendChild(div);
                    demoChat.scrollTop = demoChat.scrollHeight;
                }, idx * 500);
            });
        }

        // Initial demo - first scenario
        displayMessages(demoConversations[0].questions);
    }
}

function showDemoMessage(index) {
    const chatContainer = document.getElementById('demoChat');
    const messages = demoConversations[index].questions;

    chatContainer.innerHTML = '';
    messages.forEach((msg, idx) => {
        setTimeout(() => {
            const userDiv = document.createElement('div');
            userDiv.className = 'demo-message user';
            userDiv.textContent = msg.user;
            chatContainer.appendChild(userDiv);

            setTimeout(() => {
                const botDiv = document.createElement('div');
                botDiv.className = 'demo-message bot';
                botDiv.textContent = msg.bot;
                chatContainer.appendChild(botDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 600);
        }, idx * 1300);
    });
}
