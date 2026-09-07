import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { becomeSellerSchema, type BecomeSellerInput } from '@prioritizz/schemas';
import { Button, Card, Field, Input, Textarea, IconSparkles } from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { haptic } from '../lib/telegram';

export default function BecomeSellerPage() {
  const t = useT();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BecomeSellerInput>({
    resolver: zodResolver(becomeSellerSchema),
    defaultValues: { displayName: '', about: '', contactHandle: '', acceptTerms: undefined },
  });

  const accepted = watch('acceptTerms') === true;

  const become = useMutation({
    mutationFn: async (input: BecomeSellerInput) => {
      await api.me.becomeSeller(input);
      // The SELLER role is written to the database, but guards read roles off
      // the JWT — without refreshing here every seller route would 403 until
      // the access token happened to expire.
      const tokens = useAuthStore.getState().tokens;
      if (tokens?.refreshToken) {
        const refreshed = await api.auth.refresh(tokens.refreshToken);
        setSession(refreshed.user, refreshed.tokens);
      }
    },
    onSuccess: () => {
      haptic('medium');
      navigate('/sell', { replace: true });
    },
  });

  const failed = become.isError;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="title-large">{t('seller.becomeTitle')}</h1>
        <p className="subhead">{t('seller.becomeSubtitle')}</p>
      </header>

      <Card className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.12] text-primary">
          <IconSparkles size={19} />
        </span>
        <p className="text-footnote text-muted">{t('seller.becomeBenefits')}</p>
      </Card>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => become.mutateAsync(values).catch(() => undefined))}
      >
        <Field
          label={t('seller.displayName')}
          hint={t('seller.displayNameHint')}
          error={errors.displayName?.message}
        >
          <Input {...register('displayName')} placeholder={t('seller.displayNamePlaceholder')} />
        </Field>

        <Field label={t('seller.about')} error={errors.about?.message}>
          <Textarea {...register('about')} placeholder={t('seller.aboutPlaceholder')} rows={4} />
        </Field>

        <Field
          label={t('seller.contactHandle')}
          hint={t('seller.contactHandleHint')}
          error={errors.contactHandle?.message}
        >
          <Input {...register('contactHandle')} placeholder="@username" />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-grouped p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            checked={accepted}
            onChange={(e) =>
              setValue('acceptTerms', (e.target.checked || undefined) as true, {
                shouldValidate: true,
              })
            }
          />
          <span className="text-footnote">{t('seller.acceptTerms')}</span>
        </label>
        {errors.acceptTerms && (
          <p className="text-footnote text-tint-red">{t('seller.acceptTermsRequired')}</p>
        )}

        {failed && <p className="text-footnote text-tint-red">{t('common.somethingWrong')}</p>}

        <Button type="submit" size="block" loading={isSubmitting || become.isPending}>
          {t('seller.becomeCta')}
        </Button>
      </form>
    </div>
  );
}
