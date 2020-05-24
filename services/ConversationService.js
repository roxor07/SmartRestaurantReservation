class ConversationService {
    static async run(witService, context, text) {
        if (!context.conversation) {
            context.conversation = {
                entities: {},
                followUp: '',
                complete: false,
                exit: false
            }
        }
        if (!text) {
            context.conversation.followUp = 'Hi! What can I do for you?';
            return context;
        }
        //inferring entities from text via witService
        const entities = await witService.query(text);

        //merge already existing entities with new ones 
        context.conversation.entities = { ...context.conversation.entities, ...entities };
        if (context.conversation.entities.bye) {
            context.conversation.followUp = "Bye Bye!";
            context.conversation.exit = true;
            return context;
        }
        if (context.conversation.entities.intent === 'reservation') {
            return ConversationService.intentReservation(context);
        }
        if (context.conversation.entities.greetings) {
            context.conversation.followUp = "Hi, I'm Resi! How may I help you?";
            return context;
        }
        context.conversation.followUp = 'Could you please rephrase that?';
        return context;
    }

    static intentReservation(context) {
        const entities = context.conversation.entities;
        if (!entities.reservationDateTime) {
            context.conversation.followUp = 'For when do you want the reservation?'
            return context;
        }
        if (!entities.numberOfGuests) {
            context.conversation.followUp = 'For how many persons?'
            return context;
        }
        if (!entities.customerName) {
            context.conversation.followUp = 'Under what name do you want this reservation?'
            return context;
        }
        context.conversation.complete = true;
        return context;
    }
}

module.exports = ConversationService;