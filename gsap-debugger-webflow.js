// gsap-debugger-webflow.js

/**
 * GSAP Live Animation Debugger/Monitor for Webflow Projects
 * Version: 1.0.5 (Semantic Versioning: MAJOR.MINOR.PATCH)
 * - Incremented patch for:
 * - Adopting styling from the user's existing debug panel (position, background, font, padding).
 * - Implementing `pointer-events: none` on the overlay, while enabling it selectively for UI controls.
 *
 * This script provides an on-screen overlay debugger to help Webflow developers
 * monitor and troubleshoot GSAP animations and ScrollTrigger states in real-time.
 *
 * Installation:
 * 1. Save this code as a .js file (e.g., 'gsap-debugger.js').
 * 2. Upload it to a CDN or your own server to get a public URL.
 * 3. In your Webflow project settings, go to 'Custom Code' -> 'Footer Code'.
 * 4. Add the following script tag, replacing YOUR_SCRIPT_URL with the actual URL:
 * <script src="YOUR_SCRIPT_URL/gsap-debugger.js"></script>
 * 5. Publish your Webflow project.
 *
 * Usage:
 * - To activate the debugger: Append '?gsapdbug=true' to your site's URL.
 * (e.g., yoursite.webflow.io/?gsapdbug=true)
 * - To deactivate: Append '?gsapdbug=false' to your site's URL, or click 'OFF' button in debugger.
 * The state persists in local storage.
 * - Toggle visibility: Click the 'ON/OFF' button in the debugger or use Ctrl+D (Cmd+D on Mac).
 * - Filter information: Use the checkboxes in the debugger menu.
 * - ScrollTrigger Markers: Toggle GSAP's built-in markers via the checkbox.
 */
(function() {
    // --- Configuration and Persistence ---
    const DEBUGGER_VERSION = "1.0.5"; // Updated debugger version constant
    const DEBUGGER_PARAM = 'gsapdbug';
    const LOCAL_STORAGE_KEY = 'gsapDebuggerEnabled';

    let debuggerEnabled = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(DEBUGGER_PARAM)) {
        debuggerEnabled = urlParams.get(DEBUGGER_PARAM) === 'true';
        localStorage.setItem(LOCAL_STORAGE_KEY, debuggerEnabled);
    }

    if (!debuggerEnabled) {
        console.log('GSAP Debugger: Not enabled. Add ?gsapdbug=true to the URL to activate it.');
        return;
    }

    // --- Inject CSS Styles ---
    // Inject a <style> block into the head to ensure debugger styles are applied consistently
    const injectDebuggerStyles = () => {
        const styleId = 'gsap-debugger-styles';
        if (document.getElementById(styleId)) return; // Prevent duplicate injection

        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.textContent = `
            #gsap-debugger-overlay {
                position: fixed !important;
                bottom: 10px !important; /* Changed from top */
                left: 10px !important;   /* Changed from right */
                background: rgba(0, 0, 0, 0.7) !important; /* Darker, more transparent background */
                color: #ffffff !important; /* White text */
                font-family: monospace !important; /* Monospace font */
                font-size: 12px !important; /* Smaller font size */
                padding: 10px !important; /* Adjusted padding */
                border-radius: 8px !important;
                z-index: 999999 !important; /* High z-index */
                width: 340px !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                box-shadow: none !important; /* Removed shadow to match original debugger */
                display: flex !important;
                flex-direction: column !important;
                line-height: 1.5 !important; /* Added line height for readability */
                pointer-events: none !important; /* Makes the debugger transparent to mouse events by default */
            }
            #gsap-debugger-overlay * {
                color: #ffffff !important; /* Ensure all child elements have white text */
                box-sizing: border-box !important; /* Prevent layout issues */
            }
            #gsap-debugger-overlay h4 {
                margin: 0 !important;
                font-size: 16px !important;
            }
            #gsap-debugger-overlay p {
                margin: 0 !important;
            }
            #gsap-debugger-overlay hr {
                border: none !important;
                border-top: 1px dashed #555 !important;
                margin: 10px 0 !important;
            }
            /* Styling for interactive elements within the debugger */
            #gsap-debugger-overlay button,
            #gsap-debugger-overlay label {
                pointer-events: auto !important; /* Enable pointer events for buttons and labels */
            }
            #gsap-debugger-overlay button {
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid #777 !important;
                color: #ffffff !important;
                padding: 4px 10px !important;
                cursor: pointer !important;
                border-radius: 4px !important;
                font-size: 12px !important;
                transition: background 0.2s, color 0.2s, border-color 0.2s !important;
            }
            #gsap-debugger-overlay button#gsap-debugger-toggle.on {
                background: rgba(0, 150, 0, 0.4) !important;
                border-color: #00a000 !important;
            }
            #gsap-debugger-overlay button#gsap-debugger-toggle.off {
                background: rgba(150, 0, 0, 0.2) !important;
                border-color: #a00000 !important;
            }
            #gsap-debugger-overlay .debugger-section {
                margin-bottom: 15px !important;
            }
            #gsap-debugger-overlay .debugger-section div {
                margin-bottom: 8px !important;
                padding: 5px !important;
                border: 1px solid #444 !important;
                border-radius: 4px !important;
            }
            #gsap-debugger-overlay label {
                display: flex !important;
                align-items: center !important;
                margin-bottom: 8px !important;
                cursor: pointer !important;
            }
            #gsap-debugger-overlay input[type="checkbox"] {
                margin-right: 8px !important;
                transform: scale(1.2) !important;
                accent-color: #00a000 !important; /* Green checkbox checkmark */
            }
        `;
        document.head.appendChild(styleTag);
    };

    // --- Webflow Environment & GSAP/ScrollTrigger Detection ---
    const initializeDebugger = () => {
        injectDebuggerStyles(); // Inject styles early

        const gsapAvailable = typeof window.gsap === 'object';
        const scrollTriggerAvailable = gsapAvailable && typeof window.ScrollTrigger === 'function';

        if (!gsapAvailable) {
            console.warn('GSAP Debugger (Webflow): GSAP not detected yet. Retrying...');
            setTimeout(initializeDebugger, 200);
            return;
        }

        console.log(`GSAP Debugger (Webflow): GSAP Detected (v${gsap.version || 'Unknown'})`);
        console.log(`GSAP Debugger (Webflow): ScrollTrigger Detected: ${scrollTriggerAvailable}`);

        // --- UI Elements and Layout ---
        const createDebuggerUI = () => {
            const debuggerContainer = document.createElement('div');
            debuggerContainer.id = 'gsap-debugger-overlay';

            // No style.cssText here, as styles are injected via <style> tag now.
            // This ensures better CSS specificity control.

            debuggerContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #555;">
                    <h4>GSAP Debugger <span style="font-size: 10px; color: #aaa;">v${DEBUGGER_VERSION}</span></h4>
                    <button id="gsap-debugger-toggle">ON</button>
                </div>
                <div id="gsap-debugger-content" style="flex-grow: 1; overflow-y: auto;">
                    <p>GSAP: ${gsapAvailable ? 'Detected (v' + (gsap.version || 'Unknown') + ')' : 'Not Found'}</p>
                    <p>ScrollTrigger: ${scrollTriggerAvailable ? 'Detected' : 'Not Found'}</p>
                    <hr>

                    <div id="gsap-debugger-menu">
                        <label>
                            <input type="checkbox" id="menu-core-animations" checked> Core Animations
                        </label>
                        <label>
                            <input type="checkbox" id="menu-timelines" checked> Timelines
                        </label>
                        <label>
                            <input type="checkbox" id="menu-scrolltrigger" checked> ScrollTrigger
                        </label>
                        <label>
                            <input type="checkbox" id="menu-events"> Events
                        </label>
                        <label>
                            <input type="checkbox" id="menu-marker-overlay"> ST Markers (Built-in)
                        </label>
                    </div>

                    <div id="gsap-debugger-animations" class="debugger-section"></div>
                    <div id="gsap-debugger-timelines" class="debugger-section"></div>
                    <div id="gsap-debugger-scrolltriggers" class="debugger-section"></div>
                    <div id="gsap-debugger-events" class="debugger-section"></div>
                </div>
            `;
            document.body.appendChild(debuggerContainer);

            const toggleButton = debuggerContainer.querySelector('#gsap-debugger-toggle');
            const debuggerContent = debuggerContainer.querySelector('#gsap-debugger-content');

            const updateToggleButton = () => {
                if (debuggerEnabled) {
                    toggleButton.textContent = 'ON';
                    toggleButton.classList.remove('off');
                    toggleButton.classList.add('on');
                    debuggerContainer.style.display = 'flex';
                } else {
                    toggleButton.textContent = 'OFF';
                    toggleButton.classList.remove('on');
                    toggleButton.classList.add('off');
                    debuggerContainer.style.display = 'none';
                }
            };

            toggleButton.addEventListener('click', () => {
                debuggerEnabled = !debuggerEnabled;
                localStorage.setItem(LOCAL_STORAGE_KEY, debuggerEnabled);
                updateToggleButton();
                if (!debuggerEnabled) {
                    activeAnimations.clear();
                    activeTimelines.clear();
                    activeScrollTriggers.clear();
                    Object.keys(eventData).forEach(key => delete eventData[key]);
                }
            });

            updateToggleButton();

            const animationDiv = debuggerContainer.querySelector('#gsap-debugger-animations');
            const timelineDiv = debuggerContainer.querySelector('#gsap-debugger-timelines');
            const scrollTriggerDiv = debuggerContainer.querySelector('#gsap-debugger-scrolltriggers');
            const eventsDiv = debuggerContainer.querySelector('#gsap-debugger-events');

            debuggerContainer.querySelector('#menu-core-animations').addEventListener('change', (e) => {
                animationDiv.style.display = e.target.checked ? 'block' : 'none';
            });
            debuggerContainer.querySelector('#menu-timelines').addEventListener('change', (e) => {
                timelineDiv.style.display = e.target.checked ? 'block' : 'none';
            });
            debuggerContainer.querySelector('#menu-scrolltrigger').addEventListener('change', (e) => {
                scrollTriggerDiv.style.display = e.target.checked ? 'block' : 'none';
            });
            debuggerContainer.querySelector('#menu-events').addEventListener('change', (e) => {
                eventsDiv.style.display = e.target.checked ? 'block' : 'none';
            });

            const stMarkerCheckbox = debuggerContainer.querySelector('#menu-marker-overlay');
            if (scrollTriggerAvailable) {
                stMarkerCheckbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        ScrollTrigger.defaults({markers: true});
                        ScrollTrigger.refresh();
                        document.querySelectorAll('.gsap-marker-scroller-start, .gsap-marker-scroller-end, .gsap-marker-start, .gsap-marker-end').forEach(marker => {
                            marker.style.display = 'block'; // Display without !important, as GSAP handles its own markers' display
                        });
                    } else {
                        ScrollTrigger.defaults({markers: false});
                        document.querySelectorAll('.gsap-marker-scroller-start, .gsap-marker-scroller-end, .gsap-marker-start, .gsap-marker-end').forEach(marker => {
                            marker.style.display = 'none'; // Hide existing markers
                        });
                    }
                });
            } else {
                stMarkerCheckbox.disabled = true;
                stMarkerCheckbox.parentElement.title = 'ScrollTrigger not available';
            }

            return {
                debuggerContainer,
                animationDiv,
                timelineDiv,
                scrollTriggerDiv,
                eventsDiv
            };
        };

        const ui = createDebuggerUI();

        // --- Data Storage ---
        const activeAnimations = new Map();
        const activeTimelines = new Map();
        const activeScrollTriggers = new Map();
        const eventData = {};

        const formatProperty = (key, value) => {
            if (typeof value === 'number') {
                return `${key}: ${value.toFixed(2)}`;
            }
            if (typeof value === 'boolean') {
                return `${key}: ${value ? 'true' : 'false'}`;
            }
            if (typeof value === 'string' && value.length > 50) {
                 return `${key}: ${value.substring(0, 47)}...`;
            }
            return `${key}: ${value}`;
        };

        const getElementIdentifier = (el) => {
            if (!el) return 'N/A';
            if (el === window) return 'Window';
            if (el === document.body) return 'Body';
            if (el.id) return `#${el.id}`;
            if (el.className) {
                const classNames = el.className.split(' ').filter(c => c.length > 0);
                if (classNames.length > 0) {
                    return `.${classNames[0]}${classNames.length > 1 ? ' (+)' : ''}`;
                }
            }
            if (el.tagName) return `<${el.tagName.toLowerCase()}>`;
            return 'Unknown Element';
        };

        // --- Update Display Function ---
        const updateDisplay = () => {
            if (!debuggerEnabled) return;

            let animHTML = '<h5>Animations:</h5>';
            if (activeAnimations.size === 0) {
                animHTML += '<p>No active animations.</p>';
            } else {
                activeAnimations.forEach((props, tween) => {
                    const target = tween.targets()[0];
                    animHTML += `<div><strong>Target: ${getElementIdentifier(target)}</strong>`;
                    // Display static properties
                    ['duration', 'delay', 'ease', 'repeat', 'yoyo', 'stagger'].forEach(prop => {
                        if (props[prop] !== undefined) {
                            animHTML += `<p style="margin-left: 10px;">${formatProperty(prop, props[prop])}</p>`;
                        }
                    });
                    // Display current (live) transform properties
                    for (const key in props.current) {
                        animHTML += `<p style="margin-left: 10px;">${formatProperty(key, props.current[key])}</p>`;
                    }
                    // Display target values for other CSS properties
                    for (const key in props) {
                        // Exclude static and 'current' properties already handled
                        if (!['duration', 'delay', 'ease', 'repeat', 'yoyo', 'stagger', 'current'].includes(key)) {
                            animHTML += `<p style="margin-left: 10px;">${formatProperty(key, props[key])} (target)</p>`;
                        }
                    }
                    animHTML += `</div>`;
                });
            }
            ui.animationDiv.innerHTML = animHTML;

            let timelineHTML = '<h5>Timelines:</h5>';
            if (activeTimelines.size === 0) {
                timelineHTML += '<p>No active timelines.</p>';
            } else {
                activeTimelines.forEach((props, timeline) => {
                    timelineHTML += `<div><strong>Timeline: ${timeline.vars.id || 'Unnamed'}</strong>`;
                    for (const key in props) {
                        if (key === 'callbacks') { // Handle callbacks object specifically
                            animHTML += `<p style="margin-left: 10px;">Callbacks:</p>`;
                            for (const cbKey in props.callbacks) {
                                animHTML += `<p style="margin-left: 20px;">- ${formatProperty(cbKey, props.callbacks[cbKey])}</p>`;
                            }
                        } else {
                            animHTML += `<p style="margin-left: 10px;">${formatProperty(key, props[key])}</p>`;
                        }
                    }
                    animHTML += `</div>`;
                });
            }
            ui.timelineDiv.innerHTML = timelineHTML;

            let stHTML = '<h5>ScrollTriggers:</h5>';
            if (activeScrollTriggers.size === 0) {
                stHTML += '<p>No active ScrollTriggers.</p>';
            } else {
                activeScrollTriggers.forEach((props, st) => {
                    stHTML += `<div>
                                <strong>Trigger: ${getElementIdentifier(st.trigger)}</strong><br>
                                Scroller: ${getElementIdentifier(st.scroller)}
                                <p style="margin-left: 10px;">Progress: ${props.currentProgress}</p>
                                <p style="margin-left: 10px;">Start: ${props.start}</p>
                                <p style="margin-left: 10px;">End: ${props.end}</p>
                                <p style="margin-left: 10px;">Scrub: ${props.scrubValue}</p>
                                <p style="margin-left: 10px;">Pin: ${props.pinState}</p>
                                <p style="margin-left: 10px;">Actions: ${props.toggleActions}</p>
                                <p style="margin-left: 10px;">Is Active: ${props.isActive}</p>
                              </div>`;
                });
            }
            ui.scrollTriggerDiv.innerHTML = stHTML;

            let eventHTML = '<h5>Events:</h5>';
            if (Object.keys(eventData).length === 0) {
                eventHTML += '<p>No active events to track.</p>';
            } else {
                for (const key in eventData) {
                    eventHTML += `<p>${formatProperty(key, eventData[key])}</p>`;
                }
            }
            ui.eventsDiv.innerHTML = eventHTML;
        };

        // --- GSAP Hooking (Core Animations) ---
        // Store original methods to allow interception
        const originalTo = gsap.to;
        const originalFrom = gsap.from;
        const originalFromTo = gsap.fromTo;
        const originalSet = gsap.set;
        const originalTimeline = gsap.timeline;

        // Override GSAP methods to capture tweens/timelines on creation
        gsap.to = function(...args) {
            const tween = originalTo.apply(gsap, args);
            monitorTween(tween);
            return tween;
        };
        gsap.from = function(...args) {
            const tween = originalFrom.apply(gsap, args);
            monitorTween(tween);
            return tween;
        };
        gsap.fromTo = function(...args) {
            const tween = originalFromTo.apply(gsap, args);
            monitorTween(tween);
            return tween;
        };
        gsap.set = function(...args) {
            const tween = originalSet.apply(gsap, args);
            return tween;
        };
        gsap.timeline = function(...args) {
            const timeline = originalTimeline.apply(gsap, args);
            monitorTimeline(timeline);
            return timeline;
        };

        // Function to monitor individual GSAP tweens
        const monitorTween = (tween) => {
            // Capture static properties only once on creation
            const staticProps = {};
            ['duration', 'delay', 'ease', 'repeat', 'yoyo', 'stagger'].forEach(prop => {
                if (tween.vars[prop] !== undefined) {
                    staticProps[prop] = tween.vars[prop];
                }
            });
            // Capture target values for other CSS properties
            const cssPropsToMonitor = {};
            Object.keys(tween.vars).forEach(key => {
                const excluded = ['onUpdate', 'onComplete', 'onStart', 'onReverseComplete', 'onInterrupt', 'onRepeat', 'onEachComplete', 'delay', 'duration', 'ease', 'repeat', 'yoyo', 'stagger', 'id', 'overwrite', 'callbackScope', 'paused', 'reversed', 'data', 'immediateRender', 'lazy', 'inherit', 'runBackwards', 'simple', 'overwrite', 'callbackScope', 'defaults', 'onToggle', 'scrollTrigger'];
                if (!excluded.includes(key) && typeof tween.vars[key] !== 'function') {
                    cssPropsToMonitor[key] = tween.vars[key]; // Store the target value
                }
            });

            activeAnimations.set(tween, {...staticProps, ...cssPropsToMonitor, current: {}}); // Initialize with empty 'current' object

            // Attach an onUpdate callback to the tween
            tween.eventCallback('onUpdate', () => {
                if (!debuggerEnabled) return; // Skip if debugger is off
                const target = tween.targets()[0];
                if (!target) return;

                const currentProps = activeAnimations.get(tween);
                if (!currentProps) return; // Should not happen, but a safety check

                // Update only live properties for performance
                const liveUpdates = {};
                const coreTransformProps = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity'];
                coreTransformProps.forEach(prop => {
                    if (tween.vars[prop] !== undefined) {
                        liveUpdates[`current_${prop}`] = gsap.getProperty(target, prop);
                    }
                });

                // Merge live updates into the stored properties
                Object.assign(currentProps.current, liveUpdates);
                activeAnimations.set(tween, currentProps);
            });

            tween.eventCallback('onComplete', () => {
                activeAnimations.delete(tween);
            });
            tween.eventCallback('onReverseComplete', () => {
                activeAnimations.delete(tween);
            });
        };

        // Function to monitor individual GSAP timelines
        const monitorTimeline = (timeline) => {
            activeTimelines.set(timeline, {});

            timeline.eventCallback('onUpdate', () => {
                if (!debuggerEnabled) return;
                const props = {
                    status: timeline.paused() ? 'paused' : (timeline.reversed() ? 'reversed' : 'playing'),
                    currentTime: timeline.time().toFixed(2) + 's',
                    timeScale: timeline.timeScale().toFixed(2),
                    totalDuration: timeline.totalDuration().toFixed(2) + 's',
                    positionParametersUsed: timeline.getChildren().some(t => typeof t.position === 'string' && (t.position.includes('<') || t.position.includes('>') || t.position.includes('+='))),
                    callbacks: {
                        onComplete: !!timeline.vars.onComplete,
                        onStart: !!timeline.vars.onStart,
                        onReverseComplete: !!timeline.vars.onReverseComplete
                    }
                };
                activeTimelines.set(timeline, props);
            });
            timeline.eventCallback('onComplete', () => {
                activeTimelines.delete(timeline);
            });
            timeline.eventCallback('onReverseComplete', () => {
                activeTimelines.delete(timeline);
            });
        };

        // --- ScrollTrigger Hooking ---
        if (scrollTriggerAvailable) {
             gsap.registerPlugin(ScrollTrigger);

            const initialSTs = ScrollTrigger.getAll();
            initialSTs.forEach(st => monitorScrollTrigger(st));

            setInterval(() => {
                ScrollTrigger.getAll().forEach(st => {
                    if (!activeScrollTriggers.has(st)) {
                        monitorScrollTrigger(st);
                    }
                });
            }, 500);
        }

        // Function to monitor individual ScrollTrigger instances
        const monitorScrollTrigger = (st) => {
            if (activeScrollTriggers.has(st)) return;

            activeScrollTriggers.set(st, {});

            const updateSTProps = (self) => {
                if (!debuggerEnabled) return;
                const props = {
                    triggerElement: getElementIdentifier(self.trigger),
                    scroller: getElementIdentifier(self.scroller),
                    start: typeof self.start === 'number' ? self.start.toFixed(0) : self.start,
                    end: typeof self.end === 'number' ? self.end.toFixed(0) : self.end,
                    currentProgress: self.progress.toFixed(3),
                    scrubValue: self.vars.scrub === true ? 'true' : (typeof self.vars.scrub === 'number' ? self.vars.scrub.toFixed(1) : 'none'),
                    pinState: self.pin ? 'true' : 'false',
                    isActive: self.isActive ? 'true' : 'false',
                    toggleActions: self.vars.toggleActions ? self.vars.toggleActions.split(' ').join(', ') : 'play, none, none, none'
                };
                activeScrollTriggers.set(st, props);
            };

            st.onUpdate(self => updateSTProps(self));
            st.onToggle(self => updateSTProps(self));
            st.onRefresh(self => updateSTProps(self));

            updateSTProps(st);
        };

        // --- Mouse/Event-Related Data ---
        const updateEventData = (type, e) => {
            if (!debuggerEnabled) return;
            eventData.eventType = type;
            if (e.clientX !== undefined) eventData.mouseX = e.clientX.toFixed(0);
            if (e.clientY !== undefined) eventData.mouseY = e.clientY.toFixed(0);
            if (e.deltaY !== undefined) eventData.deltaY = e.deltaY.toFixed(0);
            if (e.key !== undefined) eventData.lastKey = e.key;
            if (e.target) eventData.eventTarget = getElementIdentifier(e.target);
        };

        window.addEventListener('mousemove', (e) => updateEventData('mousemove', e));
        window.addEventListener('click', (e) => updateEventData('click', e));
        window.addEventListener('wheel', (e) => updateEventData('wheel', e));
        window.addEventListener('keypress', (e) => updateEventData('keypress', e));
        window.addEventListener('mousedown', (e) => updateEventData('mousedown', e));
        window.addEventListener('mouseup', (e) => updateEventData('mouseup', e));
        window.addEventListener('resize', () => {
             updateEventData('resize', { target: window });
        });

        // --- Update Loop and Keyboard Shortcut ---
        setInterval(updateDisplay, 100);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'D' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const toggleButton = ui.debuggerContainer.querySelector('#gsap-debugger-toggle');
                if (toggleButton) {
                    toggleButton.click();
                }
            }
        });
    };

    // --- Initial Entry Point ---
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeDebugger, 500);
    });

})();
