// gsap-debugger-webflow.js

/**
 * GSAP Live Animation Debugger/Monitor for Webflow Projects
 * Version: 1.0.1 (Semantic Versioning: MAJOR.MINOR.PATCH)
 * - Incremented patch for bug fix (modal resizing) and styling changes.
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
    // URL parameter to activate/deactivate the debugger
    const DEBUGGER_PARAM = 'gsapdbug';
    // Local storage key to remember the debugger's enabled state across sessions
    const LOCAL_STORAGE_KEY = 'gsapDebuggerEnabled';

    // Retrieve initial state from local storage
    let debuggerEnabled = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';

    // Check URL parameter for initial state or to override persistent state
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(DEBUGGER_PARAM)) {
        debuggerEnabled = urlParams.get(DEBUGGER_PARAM) === 'true';
        localStorage.setItem(LOCAL_STORAGE_KEY, debuggerEnabled);
    }

    // If the debugger is not enabled, exit the script early
    if (!debuggerEnabled) {
        console.log('GSAP Debugger: Not enabled. Add ?gsapdbug=true to the URL to activate it.');
        return;
    }

    // --- Webflow Environment & GSAP/ScrollTrigger Detection ---
    // This function attempts to initialize the debugger. It's called with a delay
    // to ensure GSAP and ScrollTrigger (often loaded by Webflow after custom code) are available.
    const initializeDebugger = () => {
        const gsapAvailable = typeof window.gsap === 'object';
        const scrollTriggerAvailable = gsapAvailable && typeof window.ScrollTrigger === 'function';

        // If GSAP is not yet available, retry after a short delay
        if (!gsapAvailable) {
            console.warn('GSAP Debugger (Webflow): GSAP not detected yet. Retrying...');
            setTimeout(initializeDebugger, 200);
            return;
        }

        console.log(`GSAP Debugger (Webflow): GSAP Detected (v${gsap.version || 'Unknown'})`);
        console.log(`GSAP Debugger (Webflow): ScrollTrigger Detected: ${scrollTriggerAvailable}`);

        // --- UI Elements and Styles ---
        // Creates and appends the debugger overlay to the document body
        const createDebuggerUI = () => {
            const debuggerContainer = document.createElement('div');
            debuggerContainer.id = 'gsap-debugger-overlay';

            // Apply inline CSS for positioning, appearance, and interactivity
            // Updated: Dark grey background, white text, subtle white shadow.
            // Removed: 'resize: both' to prevent unintended resizing on mouse move.
            debuggerContainer.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(40, 40, 40, 0.95); /* Dark grey background */
                color: #ffffff; /* White text */
                font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 13px;
                padding: 15px;
                border-radius: 8px;
                z-index: 999999; /* Ensure it's always on top */
                width: 340px; /* Fixed width */
                max-height: 90vh;
                overflow-y: auto; /* Allows content to scroll if it exceeds max-height */
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.3); /* Subtle white glowing effect */
                display: flex;
                flex-direction: column; /* Stacks children vertically */
            `;

            // Inner HTML structure of the debugger
            debuggerContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #555;">
                    <h4 style="margin: 0; color: #ffffff; font-size: 16px;">GSAP Debugger</h4>
                    <button id="gsap-debugger-toggle" style="background: rgba(255, 255, 255, 0.1); border: 1px solid #777; color: #ffffff; padding: 4px 10px; cursor: pointer; border-radius: 4px; font-size: 12px; transition: background 0.2s, color 0.2s, border-color 0.2s;">ON</button>
                </div>
                <div id="gsap-debugger-content" style="flex-grow: 1; overflow-y: auto;">
                    <p style="margin: 0 0 5px 0;">GSAP: ${gsapAvailable ? 'Detected (v' + (gsap.version || 'Unknown') + ')' : 'Not Found'}</p>
                    <p style="margin: 0 0 10px 0;">ScrollTrigger: ${scrollTriggerAvailable ? 'Detected' : 'Not Found'}</p>
                    <hr style="border: none; border-top: 1px dashed #555; margin: 10px 0;">

                    <div id="gsap-debugger-menu" style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="menu-core-animations" checked style="margin-right: 8px; transform: scale(1.2);"> Core Animations
                        </label>
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="menu-timelines" checked style="margin-right: 8px; transform: scale(1.2);"> Timelines
                        </label>
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="menu-scrolltrigger" checked style="margin-right: 8px; transform: scale(1.2);"> ScrollTrigger
                        </label>
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="menu-events" style="margin-right: 8px; transform: scale(1.2);"> Events
                        </label>
                        <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="menu-marker-overlay" style="margin-right: 8px; transform: scale(1.2);"> ST Markers (Built-in)
                        </label>
                    </div>

                    <!-- Sections for displaying debugger data -->
                    <div id="gsap-debugger-animations" class="debugger-section"></div>
                    <div id="gsap-debugger-timelines" class="debugger-section"></div>
                    <div id="gsap-debugger-scrolltriggers" class="debugger-section"></div>
                    <div id="gsap-debugger-events" class="debugger-section"></div>
                </div>
            `;
            document.body.appendChild(debuggerContainer); // Append the debugger to the body

            // Get references to UI elements
            const toggleButton = debuggerContainer.querySelector('#gsap-debugger-toggle');
            const debuggerContent = debuggerContainer.querySelector('#gsap-debugger-content');

            // Function to update the visual state of the toggle button and debugger visibility
            const updateToggleButton = () => {
                if (debuggerEnabled) {
                    toggleButton.textContent = 'ON';
                    toggleButton.style.backgroundColor = 'rgba(0, 150, 0, 0.4)'; // Darker green for ON
                    toggleButton.style.borderColor = '#00a000'; // Green border
                    debuggerContainer.style.display = 'flex'; // Show the debugger
                } else {
                    toggleButton.textContent = 'OFF';
                    toggleButton.style.backgroundColor = 'rgba(150, 0, 0, 0.2)'; // Darker red for OFF
                    toggleButton.style.borderColor = '#a00000'; // Red border
                    debuggerContainer.style.display = 'none'; // Hide the debugger
                }
            };

            // Event listener for the ON/OFF toggle button
            toggleButton.addEventListener('click', () => {
                debuggerEnabled = !debuggerEnabled; // Toggle state
                localStorage.setItem(LOCAL_STORAGE_KEY, debuggerEnabled); // Save state
                updateToggleButton(); // Update UI
                // If debugger is disabled, clear displayed data to clean up
                if (!debuggerEnabled) {
                    activeAnimations.clear();
                    activeTimelines.clear();
                    activeScrollTriggers.clear();
                    Object.keys(eventData).forEach(key => delete eventData[key]); // Clear event data
                }
            });

            // Initialize the toggle button state immediately
            updateToggleButton();

            // --- Menu Filtering Logic ---
            // Get references to the content display divisions
            const animationDiv = debuggerContainer.querySelector('#gsap-debugger-animations');
            const timelineDiv = debuggerContainer.querySelector('#gsap-debugger-timelines');
            const scrollTriggerDiv = debuggerContainer.querySelector('#gsap-debugger-scrolltriggers');
            const eventsDiv = debuggerContainer.querySelector('#gsap-debugger-events');

            // Add event listeners to menu checkboxes to show/hide sections
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

            // --- ScrollTrigger Markers Toggle ---
            const stMarkerCheckbox = debuggerContainer.querySelector('#menu-marker-overlay');
            if (scrollTriggerAvailable) {
                stMarkerCheckbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        // Enable GSAP's built-in markers
                        ScrollTrigger.defaults({markers: true});
                        ScrollTrigger.refresh(); // Refresh all ScrollTriggers to apply new default
                    } else {
                        // Disable markers. GSAP doesn't have a direct method to remove ALL existing markers.
                        // Setting default to false will only affect new STs.
                        // For existing ones, we manually hide their DOM elements.
                        ScrollTrigger.defaults({markers: false});
                        document.querySelectorAll('.gsap-marker-scroller-start, .gsap-marker-scroller-end, .gsap-marker-start, .gsap-marker-end').forEach(marker => {
                            marker.style.display = 'none'; // Hide existing markers
                        });
                    }
                });
            } else {
                // Disable the checkbox if ScrollTrigger is not available
                stMarkerCheckbox.disabled = true;
                stMarkerCheckbox.parentElement.title = 'ScrollTrigger not available';
            }

            // Return references to UI elements for later use
            return {
                debuggerContainer,
                animationDiv,
                timelineDiv,
                scrollTriggerDiv,
                eventsDiv
            };
        };

        // Initialize the UI elements
        const ui = createDebuggerUI();

        // --- Data Storage for Active Animations, Timelines, and ScrollTriggers ---
        const activeAnimations = new Map(); // Stores properties of active GSAP tweens (key: tween instance)
        const activeTimelines = new Map(); // Stores properties of active GSAP timelines (key: timeline instance)
        const activeScrollTriggers = new Map(); // Stores properties of active ScrollTriggers (key: ScrollTrigger instance)
        const eventData = {}; // Stores the latest event data (mouse coordinates, event type)

        // Helper function to format values for display
        const formatProperty = (key, value) => {
            if (typeof value === 'number') {
                return `${key}: ${value.toFixed(2)}`; // Format numbers to 2 decimal places
            }
            if (typeof value === 'boolean') {
                return `${key}: ${value ? 'true' : 'false'}`; // Convert booleans to string 'true'/'false'
            }
            if (typeof value === 'string' && value.length > 50) {
                 return `${key}: ${value.substring(0, 47)}...`; // Truncate long strings for readability
            }
            return `${key}: ${value}`;
        };

        // Helper function to get a readable identifier for a DOM element
        const getElementIdentifier = (el) => {
            if (!el) return 'N/A';
            if (el === window) return 'Window';
            if (el === document.body) return 'Body';
            if (el.id) return `#${el.id}`; // Prioritize ID
            if (el.className) {
                // Return the first class and indicate if more exist
                const classNames = el.className.split(' ').filter(c => c.length > 0);
                if (classNames.length > 0) {
                    return `.${classNames[0]}${classNames.length > 1 ? ' (+)' : ''}`;
                }
            }
            if (el.tagName) return `<${el.tagName.toLowerCase()}>`; // Fallback to tag name
            return 'Unknown Element';
        };

        // --- Update Display Function ---
        // This function refreshes the content of the debugger overlay
        const updateDisplay = () => {
            if (!debuggerEnabled) return; // Only update if debugger is enabled

            // Update Core Animations Section
            let animHTML = '<h5>Animations:</h5>';
            if (activeAnimations.size === 0) {
                animHTML += '<p>No active animations.</p>';
            } else {
                activeAnimations.forEach((props, tween) => {
                    const target = tween.targets()[0]; // Get the primary target element of the tween
                    animHTML += `<div style="margin-bottom: 8px; padding: 5px; border: 1px solid #444; border-radius: 4px;">
                                    <strong>Target: ${getElementIdentifier(target)}</strong>`;
                    for (const key in props) {
                        animHTML += `<p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">${formatProperty(key, props[key])}</p>`;
                    }
                    animHTML += `</div>`;
                });
            }
            ui.animationDiv.innerHTML = animHTML;

            // Update Timelines Section
            let timelineHTML = '<h5>Timelines:</h5>';
            if (activeTimelines.size === 0) {
                timelineHTML += '<p>No active timelines.</p>';
            } else {
                activeTimelines.forEach((props, timeline) => {
                    timelineHTML += `<div style="margin-bottom: 8px; padding: 5px; border: 1px solid #444; border-radius: 4px;">
                                        <strong>Timeline: ${timeline.vars.id || 'Unnamed'}</strong>`; // Use id if set, else 'Unnamed'
                    for (const key in props) {
                        timelineHTML += `<p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">${formatProperty(key, props[key])}</p>`;
                    }
                    animHTML += `</div>`;
                });
            }
            ui.timelineDiv.innerHTML = timelineHTML;

            // Update ScrollTriggers Section
            let stHTML = '<h5>ScrollTriggers:</h5>';
            if (activeScrollTriggers.size === 0) {
                stHTML += '<p>No active ScrollTriggers.</p>';
            } else {
                activeScrollTriggers.forEach((props, st) => {
                    stHTML += `<div style="margin-bottom: 8px; padding: 5px; border: 1px solid #444; border-radius: 4px;">
                                <strong>Trigger: ${getElementIdentifier(st.trigger)}</strong><br>
                                Scroller: ${getElementIdentifier(st.scroller)}
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Progress: ${props.currentProgress}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Start: ${props.start}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">End: ${props.end}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Scrub: ${props.scrubValue}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Pin: ${props.pinState}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Actions: ${props.toggleActions}</p>
                                <p style="margin-left: 10px; margin-top: 2px; margin-bottom: 2px;">Is Active: ${props.isActive}</p>
                              </div>`;
                });
            }
            ui.scrollTriggerDiv.innerHTML = stHTML;

            // Update Events Section
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
        // To monitor GSAP tweens and timelines, we intercept their creation methods.
        // We save the original methods and then replace them with our custom functions.
        const originalTo = gsap.to;
        const originalFrom = gsap.from;
        const originalFromTo = gsap.fromTo;
        const originalSet = gsap.set;
        const originalTimeline = gsap.timeline;

        // Override gsap.to method
        gsap.to = function(...args) {
            const tween = originalTo.apply(gsap, args); // Call the original method
            monitorTween(tween); // Pass the created tween to our monitor
            return tween;
        };
        // Override gsap.from method
        gsap.from = function(...args) {
            const tween = originalFrom.apply(gsap, args);
            monitorTween(tween);
            return tween;
        };
        // Override gsap.fromTo method
        gsap.fromTo = function(...args) {
            const tween = originalFromTo.apply(gsap, args);
            monitorTween(tween);
            return tween;
        };
        // Override gsap.set method
        gsap.set = function(...args) {
            const tween = originalSet.apply(gsap, args);
            // gsap.set often performs an immediate one-time operation.
            // We can still monitor it, but its 'active' state is very brief.
            // monitorTween(tween); // Uncomment if you want to monitor gsap.set tweens
            return tween;
        };
        // Override gsap.timeline method
        gsap.timeline = function(...args) {
            const timeline = originalTimeline.apply(gsap, args);
            monitorTimeline(timeline); // Pass the created timeline to our monitor
            return timeline;
        };

        // Function to monitor individual GSAP tweens
        const monitorTween = (tween) => {
            activeAnimations.set(tween, {}); // Initialize with empty object. Properties will be updated on each 'onUpdate'.

            // Attach an onUpdate callback to the tween
            tween.eventCallback('onUpdate', () => {
                if (!debuggerEnabled) return; // Skip if debugger is off
                const target = tween.targets()[0]; // Get the DOM element being animated
                if (!target) return;

                const props = {};
                // Capture common animation properties directly from tween.vars (the properties passed to gsap.to/from/fromTo)
                ['x', 'y', 'rotate', 'scale', 'opacity', 'duration', 'delay', 'ease', 'repeat', 'yoyo', 'stagger'].forEach(prop => {
                    if (tween.vars[prop] !== undefined) {
                        props[prop] = tween.vars[prop];
                    }
                });

                // Dynamically get the current computed CSS values for properties being animated
                const animatedCSSProps = Object.keys(tween.vars).filter(key => {
                    // Exclude internal GSAP control properties and callbacks
                    const excluded = ['onUpdate', 'onComplete', 'onStart', 'onReverseComplete', 'onInterrupt', 'onRepeat', 'onEachComplete', 'delay', 'duration', 'ease', 'repeat', 'yoyo', 'stagger', 'id', 'overwrite', 'callbackScope', 'paused', 'reversed', 'data', 'immediateRender', 'lazy', 'inherit', 'runBackwards', 'simple', 'overwrite', 'callbackScope', 'defaults', 'onToggle', 'scrollTrigger'];
                    return !excluded.includes(key);
                });

                const computedStyle = getComputedStyle(target); // Get current computed style
                animatedCSSProps.forEach(prop => {
                    let val = computedStyle[prop];
                    if (val && !isNaN(parseFloat(val))) {
                        val = parseFloat(val); // Convert to number if possible
                    }
                    props[`current_${prop}`] = val; // Store with a 'current_' prefix
                });

                activeAnimations.set(tween, props); // Update the map with current properties
            });

            // Remove tween from active list when it completes or reverses completes
            tween.eventCallback('onComplete', () => {
                activeAnimations.delete(tween);
            });
            tween.eventCallback('onReverseComplete', () => {
                activeAnimations.delete(tween);
            });
        };

        // Function to monitor individual GSAP timelines
        const monitorTimeline = (timeline) => {
            activeTimelines.set(timeline, {}); // Initialize

            // Attach an onUpdate callback to the timeline
            timeline.eventCallback('onUpdate', () => {
                if (!debuggerEnabled) return;
                const props = {
                    status: timeline.paused() ? 'paused' : (timeline.reversed() ? 'reversed' : 'playing'), // Playback status
                    currentTime: timeline.time().toFixed(2) + 's', // Current playhead position
                    timeScale: timeline.timeScale().toFixed(2), // Playback speed multiplier
                    totalDuration: timeline.totalDuration().toFixed(2) + 's', // Total duration of timeline
                    // Check for usage of position parameters (e.g., "<", "+=1")
                    positionParametersUsed: timeline.getChildren().some(t => typeof t.position === 'string' && (t.position.includes('<') || t.position.includes('>') || t.position.includes('+='))),
                    // Indicate if common callbacks are configured
                    callbacks: {
                        onComplete: !!timeline.vars.onComplete,
                        onStart: !!timeline.vars.onStart,
                        onReverseComplete: !!timeline.vars.onReverseComplete
                    }
                };
                activeTimelines.set(timeline, props); // Update timeline properties
            });

            // Remove timeline from active list when it completes or reverses completes
            timeline.eventCallback('onComplete', () => {
                activeTimelines.delete(timeline);
            });
            timeline.eventCallback('onReverseComplete', () => {
                activeTimelines.delete(timeline);
            });
        };

        // --- ScrollTrigger Hooking ---
        if (scrollTriggerAvailable) {
             // Register ScrollTrigger plugin (important if not auto-registered or custom build)
             gsap.registerPlugin(ScrollTrigger);

            // Monitor initially existing ScrollTrigger instances
            const initialSTs = ScrollTrigger.getAll();
            initialSTs.forEach(st => monitorScrollTrigger(st));

            // Periodically check for new ScrollTrigger instances that might be created dynamically
            setInterval(() => {
                ScrollTrigger.getAll().forEach(st => {
                    if (!activeScrollTriggers.has(st)) {
                        monitorScrollTrigger(st); // Monitor newly found ScrollTriggers
                    }
                });
            }, 500); // Check every 500ms

        }

        // Function to monitor individual ScrollTrigger instances
        const monitorScrollTrigger = (st) => {
            if (activeScrollTriggers.has(st)) return; // Avoid re-monitoring

            activeScrollTriggers.set(st, {}); // Initialize

            // Helper to update ScrollTrigger properties
            const updateSTProps = (self) => {
                if (!debuggerEnabled) return;
                const props = {
                    triggerElement: getElementIdentifier(self.trigger),
                    scroller: getElementIdentifier(self.scroller),
                    start: typeof self.start === 'number' ? self.start.toFixed(0) : self.start, // Display numeric or string start point
                    end: typeof self.end === 'number' ? self.end.toFixed(0) : self.end,     // Display numeric or string end point
                    currentProgress: self.progress.toFixed(3), // Normalized scroll progress (0-1)
                    scrubValue: self.vars.scrub === true ? 'true' : (typeof self.vars.scrub === 'number' ? self.vars.scrub.toFixed(1) : 'none'), // Scrub type/value
                    pinState: self.pin ? 'true' : 'false', // Is the element currently pinned?
                    isActive: self.isActive ? 'true' : 'false', // Is the ScrollTrigger active?
                    toggleActions: self.vars.toggleActions ? self.vars.toggleActions.split(' ').join(', ') : 'play, none, none, none' // Actions for different scroll points
                };
                activeScrollTriggers.set(st, props); // Update ScrollTrigger properties
            };

            // Attach event listeners to ScrollTrigger instance
            st.onUpdate(self => updateSTProps(self)); // Updates on scroll
            st.onToggle(self => updateSTProps(self)); // Updates when active state changes
            st.onRefresh(self => updateSTProps(self)); // Updates after a refresh event

            // Initial population of properties
            updateSTProps(st);
        };

        // --- Mouse/Event-Related Data ---
        // Updates the eventData object with latest event information
        const updateEventData = (type, e) => {
            if (!debuggerEnabled) return; // Skip if debugger is off
            eventData.eventType = type;
            if (e.clientX !== undefined) eventData.mouseX = e.clientX.toFixed(0);
            if (e.clientY !== undefined) eventData.mouseY = e.clientY.toFixed(0);
            if (e.deltaY !== undefined) eventData.deltaY = e.deltaY.toFixed(0); // For wheel events
            if (e.key !== undefined) eventData.lastKey = e.key; // For keypress events
            if (e.target) eventData.eventTarget = getElementIdentifier(e.target); // Target element of the event
        };

        // Attach global event listeners
        window.addEventListener('mousemove', (e) => updateEventData('mousemove', e));
        window.addEventListener('click', (e) => updateEventData('click', e));
        window.addEventListener('wheel', (e) => updateEventData('wheel', e));
        window.addEventListener('keypress', (e) => updateEventData('keypress', e));
        window.addEventListener('mousedown', (e) => updateEventData('mousedown', e));
        window.addEventListener('mouseup', (e) => updateEventData('mouseup', e));
        // Monitor window resize as it can affect ScrollTrigger positions
        window.addEventListener('resize', () => {
             updateEventData('resize', { target: window });
        });

        // --- Update Loop and Keyboard Shortcut ---
        // Set an interval to regularly refresh the debugger display
        setInterval(updateDisplay, 100); // Every 100 milliseconds

        // Add a keyboard shortcut (Ctrl + D or Cmd + D) to toggle debugger visibility
        window.addEventListener('keydown', (e) => {
            // Check for 'D' key and Ctrl/Cmd key modifier
            if (e.key === 'D' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault(); // Prevent browser's default action (e.g., bookmarking)
                const toggleButton = ui.debuggerContainer.querySelector('#gsap-debugger-toggle');
                if (toggleButton) {
                    toggleButton.click(); // Simulate a click on the toggle button
                }
            }
        });
    };

    // --- Initial Entry Point ---
    // Wait for the DOM to be fully loaded before attempting to create the UI
    window.addEventListener('DOMContentLoaded', () => {
        // A slight timeout is added to ensure Webflow's own scripts (including GSAP)
        // have had a chance to load and initialize, as Webflow often places them
        // late in the body or defers them.
        setTimeout(initializeDebugger, 500); // 500ms delay
    });

})();
