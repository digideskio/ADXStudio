/**
 * Modal Dialog Plugin
 */
(function (askia) {
    if (!askia || !askia.modalDialog) {
        throw new Error("NodalDialog.js is not loaded, please load it first");
    }

    var modalDialog     = askia.modalDialog,
        autoIncrement   = 0;

    modalDialog.addPlugin('preferences', {
        /**
         * Create form
         * @param  modalDialog
         */
        createButtons : function (modalDialog) {
            autoIncrement++;
            modalDialog.elements.preferences = {};
            var root = modalDialog.elements.bodyContainer,
                el   = modalDialog.elements.preferences,
                options = modalDialog.options || {},
                preferences = options.preferences || {},
                author = (preferences.author) || {};
            
            // Add extra class on the dialog box
            modalDialog.elements.dialog.classList.add('preferences');

            // Title
            el.title = document.createElement('p');
            el.title.className = 'askia-modal-preferences-title';
            el.title.innerHTML = 'Preferences';

            root.appendChild(el.title);

            // User Name
            el.userName = document.createElement('div');
            el.userName.className = 'askia-modal-preferences-container';

            el.userNameLabel = document.createElement('label');
            el.userNameLabel.setAttribute('for', 'modal_preferences_user_name_' + autoIncrement);
            el.userNameLabel.innerHTML = 'Author name:';
            el.userName.appendChild(el.userNameLabel);

            el.userNameInput = document.createElement('input');
            el.userNameInput.setAttribute('type', 'text');
            el.userNameInput.setAttribute('id', 'modal_preferences_user_name_' + autoIncrement);
            el.userNameInput.value = author.name || "";
            el.userName.appendChild(el.userNameInput);
            // Register for the auto focus
            modalDialog.elements.autoFocusOn = el.userNameInput;

            root.appendChild(el.userName);

            // User Email
            el.userEmail = document.createElement('div');
            el.userEmail.className = 'askia-modal-preferences-container';

            el.userEmailLabel = document.createElement('label');
            el.userEmailLabel.setAttribute('for', 'modal_preferences_user_email_' + autoIncrement);
            el.userEmailLabel.innerHTML = 'Email:';
            el.userEmail.appendChild(el.userEmailLabel);

            el.userEmailInput = document.createElement('input');
            el.userEmailInput.setAttribute('id', 'modal_preferences_user_email_' + autoIncrement);
            el.userEmailInput.setAttribute('type', 'email');
            el.userEmailInput.value = author.email || "";
            el.userEmail.appendChild(el.userEmailInput);

            root.appendChild(el.userEmail);

            // Company
            el.company = document.createElement('div');
            el.company.className = 'askia-modal-preferences-container';

            el.companyLabel = document.createElement('label');
            el.companyLabel.setAttribute('for', 'modal_preferences_company_' + autoIncrement);
            el.companyLabel.innerHTML = 'Company:';
            el.company.appendChild(el.companyLabel);

            el.companyInput = document.createElement('input');
            el.companyInput.setAttribute('id', 'modal_preferences_company_' + autoIncrement);
            el.companyInput.setAttribute('type', 'text');
            el.companyInput.value = author.company || "";
            el.company.appendChild(el.companyInput);

            root.appendChild(el.company);

            // Website
            el.website = document.createElement('div');
            el.website.className = 'askia-modal-preferences-container';

            el.websiteLabel = document.createElement('label');
            el.websiteLabel.setAttribute('for', 'modal_preferences_website_' + autoIncrement);
            el.websiteLabel.innerHTML = 'Website:';
            el.website.appendChild(el.websiteLabel);

            el.websiteInput = document.createElement('input');
            el.websiteInput.setAttribute('id', 'modal_preferences_website_' + autoIncrement);
            el.websiteInput.setAttribute('type', 'url');
            el.websiteInput.value = author.website || "";
            el.website.appendChild(el.websiteInput);

            root.appendChild(el.website);

            // Theme
            el.theme = document.createElement('div');
            el.theme.className = 'askia-modal-preferences-container';

            el.themeLabel = document.createElement('label');
            el.themeLabel.setAttribute('for', 'modal_preferences_theme_' + autoIncrement);
            el.themeLabel.innerHTML = 'Theme: ';
            el.theme.appendChild(el.themeLabel);

            el.themeSelect = document.createElement('select');
            el.themeSelect.setAttribute('id', 'modal_preferences_theme_' + autoIncrement);
            el.theme.appendChild(el.themeSelect);
                        
            var option
            for (var i = 0, l = options.themes.length; i < l; i++) {
                var theme = options.themes[i];
                option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                if (preferences.theme === theme) {
                    option.setAttribute('selected', 'selected');
                }
                el.themeSelect.appendChild(option)
            }
            
            root.appendChild(el.theme);
            
            // editorFontSize size
            el.editorFontSize = document.createElement('div');
            el.editorFontSize.className = 'askia-modal-preferences-container';

            el.editorFontSizeLabel = document.createElement('label');
            el.editorFontSizeLabel.setAttribute('for', 'modal_preferences_editorFontSize_' + autoIncrement);
            el.editorFontSizeLabel.innerHTML = 'Font-size: ';
            el.editorFontSize.appendChild(el.editorFontSizeLabel);

            el.editorFontSizeSelect = document.createElement('select');
            el.editorFontSizeSelect.setAttribute('id', 'modal_preferences_editorFontSize_' + autoIncrement);
            el.editorFontSize.appendChild(el.editorFontSizeSelect);
                        
            options.policies = ["12","14","16","18","20"];
            for (var i = 0, l = options.policies.length; i < l; i++) {
                var editorFontSize = options.policies[i];
                option = document.createElement('option');
                option.value = editorFontSize;
                option.textContent = editorFontSize;
                if (preferences.editorFontSize === editorFontSize) {
                    option.setAttribute('selected', 'selected');
                }
                el.editorFontSizeSelect.appendChild(option)
            }
            
            root.appendChild(el.editorFontSize);
            
            
            // Open the latest project by default
            el.reopenLastProject = document.createElement('div');
            el.reopenLastProject.className = 'askia-modal-preferences-checkbox-container';

            el.reopenLastProjectInput = document.createElement('input');
            el.reopenLastProjectInput.setAttribute('id', 'modal_preferences_reopenLastProject_' + autoIncrement);
            el.reopenLastProjectInput.setAttribute('type', 'checkbox');
            if (preferences.openLastProjectByDefault) {
                el.reopenLastProjectInput.setAttribute('checked', 'checked');
            }
            el.reopenLastProject.appendChild(el.reopenLastProjectInput);

            el.reopenLastProjectLabel = document.createElement('label');
            el.reopenLastProjectLabel.setAttribute('for', 'modal_preferences_reopenLastProject_' + autoIncrement);
            el.reopenLastProjectLabel.innerHTML = "Reopen last project on startup";
            el.reopenLastProject.appendChild(el.reopenLastProjectLabel);

            root.appendChild(el.reopenLastProject);

            // Use double click to open a file in the explorer
            el.DblClick = document.createElement('div');
            el.DblClick.className = 'askia-modal-preferences-checkbox-container';

            el.DblClickInput = document.createElement('input');
            el.DblClickInput.setAttribute('id', 'modal_preferences_DblClick_' + autoIncrement);
            el.DblClickInput.setAttribute('type', 'checkbox');
            if (preferences.useDblClickByDefault) {
                el.DblClickInput.setAttribute('checked', 'checked');
            }
            el.DblClick.appendChild(el.DblClickInput);

            el.DblClickLabel = document.createElement('label');
            el.DblClickLabel.setAttribute('for', 'modal_preferences_DblClick_' + autoIncrement);
            el.DblClickLabel.innerHTML = "Use double click to open file from the explorer";
            el.DblClick.appendChild(el.DblClickLabel);

            root.appendChild(el.DblClick);


            // OK / Cancel button

            modalDialog.addOkButton();
            modalDialog.addCancelButton();
        },

        /**
         * Validate the form
         * @param modalDialog
         * @param retVal
         */
        validate : function validate(modalDialog, retVal) {
            var el   = modalDialog.elements.preferences;
            retVal.value = {
                preferences : {
                    author: {
                        name: el.userNameInput.value,
                        email: el.userEmailInput.value,
                        company: el.companyInput.value,
                        website: el.websiteInput.value
                    },
                    theme: el.themeSelect.value,
                    openLastProjectByDefault : el.reopenLastProjectInput.checked,
                    useDblClickByDefault : el.DblClickInput.checked,
                    editorFontSize : el.editorFontSizeSelect.value
                }
            };
        }
    });

}(window.askia));
