import { useEffect } from 'react';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MAX_SERVICE_IMAGES,
  serviceUpsertSchema,
  type ServiceUpsertInput,
} from '@prioritizz/schemas';
import { DELIVERY_TYPE, SERVICE_KIND, CURRENCY } from '@prioritizz/constants';
import {
  Button,
  Card,
  Field,
  ImageUploader,
  Input,
  LoadingState,
  Select,
  Textarea,
  IconPlus,
  IconTrash,
} from '@prioritizz/ui';
import { useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useImageUpload } from '../hooks/useImageUpload';
import { haptic } from '../lib/telegram';

const EMPTY: ServiceUpsertInput = {
  title: '',
  summary: '',
  description: '',
  kind: 'DIGITAL_GOOD',
  deliveryType: 'MANUAL_CONFIRM',
  categoryId: '',
  currency: 'XTR',
  basePriceAmount: '',
  slaHours: 24,
  refundPolicy: '',
  terms: undefined,
  tags: [],
  minQuantity: 1,
  maxQuantity: 1,
  perBuyerLimit: 0,
  autoModeration: true,
  sellerCommissionOverrideBps: null,
  variants: [],
  attachmentIds: [],
};

export default function ListingFormPage() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const existing = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.catalog.getService(id!),
    enabled: isEdit,
  });

  const photos = useImageUpload({ ownerType: 'SERVICE' });

  const form = useForm<ServiceUpsertInput>({
    // The schema's `.default()` / `.superRefine()` make zod's input and output
    // types diverge; the resolver validates against the same schema either way.
    resolver: zodResolver(serviceUpsertSchema) as unknown as Resolver<ServiceUpsertInput>,
    defaultValues: EMPTY,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const variants = useFieldArray({ control, name: 'variants' });

  // Hydrate once the listing arrives; media rows seed the uploader grid.
  useEffect(() => {
    const s = existing.data;
    if (!s) return;
    reset({
      ...EMPTY,
      title: s.title,
      summary: s.summary,
      description: s.description,
      kind: s.kind,
      deliveryType: s.deliveryType,
      categoryId: s.category.id,
      currency: s.currency,
      basePriceAmount: s.basePriceAmount,
      slaHours: s.slaHours,
      refundPolicy: s.refundPolicy,
      terms: s.terms ?? undefined,
      tags: s.tags,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      variants: s.variants.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        priceAmount: v.priceAmount,
        isDefault: v.isDefault,
        stock: v.stock,
        isActive: v.isActive,
      })),
      attachmentIds: s.media.map((m) => m.id),
    });
    photos.reset(s.media.map((m) => ({ id: m.id, url: m.url, status: 'ready' as const })));
    // photos.reset is stable; re-running on every render would clobber edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: async ({ values, publish }: { values: ServiceUpsertInput; publish: boolean }) => {
      const payload = { ...values, attachmentIds: photos.attachmentIds };
      const saved = isEdit
        ? await api.catalog.updateService(id!, payload)
        : await api.catalog.createService(payload);
      if (publish) await api.catalog.submitService(saved.id);
      return saved;
    },
    onSuccess: () => {
      haptic('medium');
      void qc.invalidateQueries({ queryKey: ['my-services'] });
      navigate('/sell', { replace: true });
    },
  });

  if (isEdit && existing.isLoading) return <LoadingState label={t('common.loading')} />;

  const submit = (publish: boolean) =>
    handleSubmit((values) => save.mutateAsync({ values, publish }).catch(() => undefined))();

  return (
    <div className="space-y-4">
      <h1 className="title-large">{isEdit ? t('listing.editTitle') : t('listing.createTitle')}</h1>

      <Card className="space-y-2">
        <p className="text-footnote font-semibold">{t('listing.photos')}</p>
        <ImageUploader
          items={photos.items}
          onAdd={(files) => void photos.add(files)}
          onRemove={photos.remove}
          max={MAX_SERVICE_IMAGES}
          labels={{
            add: t('listing.addPhoto'),
            remove: t('listing.removePhoto'),
            empty: t('listing.photosEmpty'),
          }}
        />
        <p className="text-caption text-subtle">
          {t('listing.photosHint', { max: MAX_SERVICE_IMAGES })}
        </p>
      </Card>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label={t('listing.title')} error={errors.title?.message}>
          <Input {...register('title')} placeholder={t('listing.titlePlaceholder')} />
        </Field>

        <Field label={t('listing.summary')} error={errors.summary?.message}>
          <Input {...register('summary')} placeholder={t('listing.summaryPlaceholder')} />
        </Field>

        <Field label={t('listing.description')} error={errors.description?.message}>
          <Textarea
            {...register('description')}
            rows={5}
            placeholder={t('listing.descriptionPlaceholder')}
          />
        </Field>

        <Field label={t('listing.category')} error={errors.categoryId?.message}>
          <Select {...register('categoryId')}>
            <option value="">—</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('listing.kind')} error={errors.kind?.message}>
            <Select {...register('kind')}>
              {SERVICE_KIND.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('listing.deliveryType')} error={errors.deliveryType?.message}>
            <Select {...register('deliveryType')}>
              {DELIVERY_TYPE.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label={t('listing.price')} error={errors.basePriceAmount?.message}>
            <Input
              {...register('basePriceAmount')}
              inputMode="decimal"
              placeholder="100"
              autoComplete="off"
            />
          </Field>
          <Field label={t('listing.currency')} error={errors.currency?.message}>
            <Select {...register('currency')} className="w-28">
              {CURRENCY.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label={t('listing.slaHours')} error={errors.slaHours?.message}>
            <Input {...register('slaHours', { valueAsNumber: true })} inputMode="numeric" />
          </Field>
          <Field label={t('listing.minQuantity')} error={errors.minQuantity?.message}>
            <Input {...register('minQuantity', { valueAsNumber: true })} inputMode="numeric" />
          </Field>
          <Field label={t('listing.maxQuantity')} error={errors.maxQuantity?.message}>
            <Input {...register('maxQuantity', { valueAsNumber: true })} inputMode="numeric" />
          </Field>
        </div>

        <Field label={t('listing.refundPolicy')} error={errors.refundPolicy?.message}>
          <Textarea
            {...register('refundPolicy')}
            rows={3}
            placeholder={t('listing.refundPolicyPlaceholder')}
          />
        </Field>

        <Card flush className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-footnote font-semibold">{t('listing.variants')}</p>
              <p className="text-caption text-subtle">{t('listing.variantsHint')}</p>
            </div>
            <Button
              size="sm"
              variant="grouped"
              onClick={() =>
                variants.append({
                  name: '',
                  priceAmount: '',
                  isDefault: variants.fields.length === 0,
                  isActive: true,
                })
              }
            >
              <IconPlus size={14} />
              {t('listing.addVariant')}
            </Button>
          </div>

          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <Field label={t('listing.variantName')} error={errors.variants?.[i]?.name?.message}>
                <Input {...register(`variants.${i}.name`)} />
              </Field>
              <Field
                label={t('listing.variantPrice')}
                error={errors.variants?.[i]?.priceAmount?.message}
              >
                <Input {...register(`variants.${i}.priceAmount`)} inputMode="decimal" />
              </Field>
              <Button
                size="icon"
                variant="grouped"
                aria-label={t('common.cancel')}
                onClick={() => variants.remove(i)}
              >
                <IconTrash size={16} />
              </Button>
            </div>
          ))}

          {errors.variants?.message && (
            <p className="text-footnote text-tint-red">{errors.variants.message}</p>
          )}
        </Card>

        {save.isError && (
          <p className="text-footnote text-tint-red">{t('common.somethingWrong')}</p>
        )}
        {photos.busy && <p className="text-footnote text-subtle">{t('listing.uploading')}</p>}

        <div className="flex gap-3">
          <Button
            variant="grouped"
            className="flex-1"
            disabled={photos.busy}
            loading={save.isPending && !save.variables?.publish}
            onClick={() => submit(false)}
          >
            {t('listing.save')}
          </Button>
          <Button
            className="flex-1"
            disabled={photos.busy}
            loading={save.isPending && !!save.variables?.publish}
            onClick={() => submit(true)}
          >
            {t('listing.saveAndPublish')}
          </Button>
        </div>
      </form>
    </div>
  );
}
