import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

type FormAddImageData = {
  title: string;
  description: string;
  image: unknown;
};

interface FormAddImageProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ModalAddImage({ onClose }: FormAddImageProps): JSX.Element {
  const regexInputImageAcceptedFormats =
    /(?:([^:/?#]+):)?(?:([^/?#]*))?([^?#](?:jpeg|gif|png))(?:\?([^#]*))?(?:#(.*))?/g;

  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations = {
    image: {
      required: 'Arquivo obrigatório',
      validate: {
        lessThan10MB: ([file]) =>
          file.size < 10000000 || 'O arquivo deve ser menor que 10MB',
        acceptedFormats: ([file]) =>
          regexInputImageAcceptedFormats.test(file.type) ||
          'Somente são aceitos arquivos PNG, JPEG e GIF',
      },
    },
    title: {
      required: 'Título obrigatório',
      minLength: {
        value: 2,
        message: 'Mínimo de 2 caracteres',
      },
      maxLength: {
        value: 20,
        message: 'Máximo de 20 caracteres',
      },
    },
    description: {
      required: 'Descrição obrigatória',
      maxLength: {
        value: 65,
        message: 'Máximo de 65 caracteres',
      },
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (formData: FormAddImageData) => {
      const { title, description } = formData;

      const { data } = await api.post('/api/images', {
        url: imageUrl,
        title,
        description,
      });

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');
      },
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();
  const { errors } = formState;

  const onSubmit = async (data: FormAddImageData): Promise<void> => {
    const { image } = data;

    try {
      if (!image || !imageUrl) {
        toast({
          title: 'Imagem não encontrada',
          description:
            'É preciso adicionar e aguardar o upload de uma imagem antes de realizar o cadastro.',
          status: 'info',
        });
        return;
      }

      await mutation.mutateAsync(data);

      toast({
        title: 'Imagem cadastrada',
        description: 'Sua imagem foi cadastrada com sucesso.',
        status: 'success',
      });
    } catch {
      toast({
        title: 'Falha no cadastro',
        description: 'Ocorreu um erro ao tentar cadastrar a sua imagem.',
        status: 'error',
      });
    } finally {
      reset();
      setLocalImageUrl('');
      setImageUrl('');
      onClose();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          {...register('image', formValidations.image)}
          error={errors.image}
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
        />

        <TextInput
          {...register('title', formValidations.title)}
          error={errors.title}
          placeholder="Título da imagem..."
        />

        <TextInput
          {...register('description', formValidations.description)}
          error={errors.description}
          placeholder="Descrição da imagem..."
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
