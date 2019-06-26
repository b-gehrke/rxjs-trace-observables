/**
 * Base interface for all messages send by this library
 */
export interface Message<T> {
    /**
     * Type of the message.
     */
    type: string,

    /**
     * Content of the message. Make sure every type is mapped to one ContentType
     */
    content: T
}
