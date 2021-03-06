"""
    Generator.
"""
import tensorflow as tf
from utils.utils import Conv2d, weight_initializer, leaky_relu
from model.networks.architecture import spade_resblk


def Generator(segmap_shape, z_dim=256, num_upsampling_layers='more', num_filters=64, use_vae=True):
    """Generator.

          The architecture of the generator consists mainly of a series of SPADE ResBlks with nearest
        neighbor upsampling.
    """

    segmap = tf.keras.layers.Input(shape=segmap_shape[1:])
    if use_vae:
        z = tf.keras.layers.Input(shape=z_dim)

    num_up_layers = 6 if num_upsampling_layers=='more' else \
                    5 if num_upsampling_layers=='normal' else \
                    7
    if (num_up_layers==7 and num_upsampling_layers!='most'):
        raise ValueError('num_upsampling_layers [%s] not recognized' %
                          num_upsampling_layers)

    with tf.compat.v1.variable_scope('Generator'):
        # crop_size = segmap_width or segmapt_height
        s_dim = segmap_shape[1] // (2**num_up_layers)

        batch_size = segmap_shape[0]
        k_init = 16 * num_filters

        # Sample z from unit normal and reshape the tensor
        if use_vae:
            # if z is None:
                # z = tf.keras.backend.random_normal([batch_size, z_dim], dtype=tf.dtypes.float32)
            x = tf.keras.layers.Dense(k_init*s_dim*s_dim, kernel_initializer=weight_initializer())(z)
            x = tf.reshape(x, [batch_size, s_dim, s_dim, k_init])
        else:
            x = tf.image.resize(images=segmap, size=[s_dim, s_dim],
                                method=tf.image.ResizeMethod.NEAREST_NEIGHBOR)
            x = Conv2d(x, k_init, kernel_size=3, padding=1)

        x = spade_resblk(segmap, x, k_init, spectral_norm=True)

        x = upsample(x)
        x = spade_resblk(segmap, x, k_init, spectral_norm=True)

        if num_upsampling_layers in ['more', 'most']:
            x = upsample(x)

        x = spade_resblk(segmap, x, k_init, spectral_norm=True)
        x = upsample(x)
        x = spade_resblk(segmap, x, 8*num_filters, spectral_norm=True)
        x = upsample(x)
        x = spade_resblk(segmap, x, 4*num_filters, spectral_norm=True)
        x = upsample(x)
        x = spade_resblk(segmap, x, 2*num_filters, spectral_norm=True)
        x = upsample(x)
        x = spade_resblk(segmap, x, num_filters, spectral_norm=True)

        if num_upsampling_layers == 'most':
            x = upsample(x)
            x = spade_resblk(segmap, x, num_filters//2, spectral_norm=True)

        x = leaky_relu(x)
        x = Conv2d(x, 3, kernel_size=3, padding=1)
        x = tf.keras.activations.tanh(x)

        return tf.keras.Model(inputs=[segmap, z], outputs=x) if use_vae else \
               tf.keras.Model(inputs=segmap, outputs=x)


def upsample(x, scale_factor=2):
    """Upsamples a given tensor."""
    _, h, w, _ = x.shape

    return tf.image.resize(images=x, size=[h * scale_factor, w * scale_factor],
                           method=tf.image.ResizeMethod.NEAREST_NEIGHBOR)






