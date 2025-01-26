const guidRegex = /[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/;
const myEnvironmentGuids = [
    "185fb43f-a1bb-4661-9d3c-3425c8ae77e0", // Dev
    "a1976cb9-f830-45c0-9bfc-35485c104fac", // Test
    "46140f10-80dc-e700-bb59-0e6ba434b817", // PreProd
    "bd4528e4-cfd0-41e5-bdfe-277dab176c35"  // Prod
];

// Get the URL and environment GUID of the current PowerApps page
async function getCurrentTabInfo() {
    const tabs = await browser.tabs.query({ currentWindow: true, active: true });
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;

    // No info is needed for non-PowerApps pages
    if (!currentUrl.includes('make.powerapps.com')) {
        return null;
    }

    const guidMatch = currentUrl.match(guidRegex);
    if (guidMatch != null && myEnvironmentGuids.includes(guidMatch[0])) {
        return {
            url: currentUrl,
            guid: guidMatch[0]
        };
    }
    return null;
}

// Swap the GUID in the URL
function swapGuidInUrl(url, oldGuid, newGuid) {
    return url.replace(oldGuid, newGuid);
}

document.addEventListener("DOMContentLoaded", async () => {
    const buttons = document.querySelectorAll(".env-button");
    const tabResult = await getCurrentTabInfo();

    // If not on a PowerApps page, buttons link to the default environment page
    if (tabResult == null) {
        buttons.forEach(button => {
            const targetGuid = button.getAttribute("env-guid");
            if (targetGuid) {
                const defaultUrl = `https://make.powerapps.com/environments/${targetGuid}/entities`;

                // Left-click: Open in current tab
                button.addEventListener("click", () => {
                    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        browser.tabs.update(tabs[0].id, { url: defaultUrl });
                        window.close(); // Close the popup
                    });
                });

                // Right-click: Open in new tab
                button.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                    window.open(defaultUrl, "_blank");
                });
            }
        });
    } else {
        // On a PowerApps page, swap the GUID in the URL
        const { url: currentUrl, guid: currentGuid } = tabResult;

        buttons.forEach(button => {
            const targetGuid = button.getAttribute("env-guid");
            if (targetGuid && targetGuid !== currentGuid) {
                const newUrl = swapGuidInUrl(currentUrl, currentGuid, targetGuid);

                // Left-click: Open in current tab
                button.addEventListener("click", () => {
                    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        browser.tabs.update(tabs[0].id, { url: newUrl });
                        window.close(); // Close the popup
                    });
                });

                // Right-click: Open in new tab
                button.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                    window.open(newUrl, "_blank");
                });
            } else {
                // Disable the button if it's for the current environment
                button.disabled = true;
            }
        });
    }
});
