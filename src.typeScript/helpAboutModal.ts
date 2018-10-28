namespace com.mordritch.mcSim {
    export class helpAboutModal {
        private modal: guiFullModal;
        private L10n: localization;

        constructor(gui: gui) {
            this.L10n = gui.localization;

            this.modal = new guiFullModal(gui, false);
            // this.modal.addButton({
            //     label: this.L10n.getString("button.text.ok"),
            //     onActivateFunction: () => {
            //         this.modal.hide();
            //     }});
        }

        show(): void {
            this.modal.setContent(
                '<div class="documentInfo standardForm">' +
                    '<p><b>'+this.L10n.getString("helpAboutModal.title")+'</b></p>' +
                    '<p>Created by Jonathan Lydall (Mordritch)</p>' +
    
                    '<p><b>Thank you to the following people for their contributions:</b></p>' +
                    '<li><a href="https://github.com/ollyhayes" target="_blank">ollyhayes</a>: Added repeater <a href="https://minecraft.gamepedia.com/Redstone_Repeater#Signal_locking" target="_blank">signal locking</a>.</li>' +
                '</div>'
            );
            this.modal.show();
        }
    }
}