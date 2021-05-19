// Styles
import './VDialog.sass'

import { defineComponent, mergeProps, ref, watch } from 'vue'
import { VOverlay } from '@/components/VOverlay'

// Helpers
// import {
//   convertToUnit,
//   keyCodes,
// } from '../../util/helpers'
import { makeProps } from '@/util/makeProps'
import { makeDimensionProps, useDimension } from '@/composables/dimensions'
import { makeTransitionProps } from '@/composables/transition'
import { useProxiedModel } from '@/composables/proxiedModel'
import { VDialogTransition } from '@/components/transitions'

export default defineComponent({
  name: 'VDialog',

  props: makeProps({
    fullscreen: Boolean,
    origin: {
      type: String,
      default: 'center center',
    },
    retainFocus: {
      type: Boolean,
      default: true,
    },
    scrollable: Boolean,
    modelValue: Boolean,
    ...makeDimensionProps({ width: 'auto' }),
    ...makeTransitionProps({ transition: 'dialog-transition' }),
  }),

  setup (props, { attrs, slots, emit }) {
    const isActive = useProxiedModel(props, 'modelValue')
    const { dimensionStyles } = useDimension(props)

    const overlay = ref<InstanceType<typeof VOverlay>>()
    function onFocusin (e: FocusEvent) {
      const before = e.relatedTarget as HTMLElement | null
      const after = e.target as HTMLElement | null

      if (
        before !== after &&
        overlay.value?.content &&
        // It isn't the document or the dialog body
        ![document, overlay.value.content].includes(after!) &&
        // It isn't inside the dialog body
        !overlay.value.content.contains(after)
        // We're the topmost dialog
        // TODO: this.activeZIndex >= this.getMaxZIndex() &&
        // It isn't inside a dependent element (like a menu)
        // TODO: !this.getOpenDependentElements().some(el => el.contains(target))
        // So we must have focused something outside the dialog and its children
      ) {
        const focusable = [...overlay.value.content.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )].filter(el => !el.hasAttribute('disabled')) as HTMLElement[]
        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (before === firstElement) {
          lastElement.focus()
        } else {
          firstElement.focus()
        }
      }
    }
    watch(() => isActive.value && props.retainFocus, val => {
      val
        ? document.addEventListener('focusin', onFocusin)
        : document.removeEventListener('focusin', onFocusin)
    })

    const activatorElement = ref()
    const activator = ({ props, ...data }: any) => {
      return slots.activator?.({
        ...data,
        props: mergeProps(props, {
          onClick: (e: MouseEvent) => {
            activatorElement.value = e.currentTarget
          },
        }),
      })
    }

    return () => {
      const transition = mergeProps(
        {
          component: VDialogTransition,
          target: activatorElement.value,
        },
        typeof props.transition === 'string'
          ? { name: props.transition }
          : props.transition as any
      ) as any

      return (
        <VOverlay
          v-model={ isActive.value }
          class={[
            'v-dialog',
            {
              'v-dialog--fullscreen': props.fullscreen,
            },
          ]}
          style={ dimensionStyles.value }
          transition={ transition }
          ref={ overlay }
          aria-role="dialog"
          aria-modal="true"
          { ...attrs }
          v-slots={{
            default: slots.default,
            activator,
          }}
        />
      )
    }
  },
})