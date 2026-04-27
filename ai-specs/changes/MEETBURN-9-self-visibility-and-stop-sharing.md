# MEETBURN-9: Self-visibility fix + Stop sharing button

## Status: Superseded by MEETBURN-10

The self-registration via SharedMap (ADR-010) is superseded by the local-state architecture (ADR-012). Self-visibility in the new model is handled by `useMeetingState` directly reading `app.getContext()` without SharedMap interaction.

The stop sharing button (ADR-011) remains valid and carries over to MEETBURN-10.
