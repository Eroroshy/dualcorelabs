import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Searchbar } from 'react-native-paper'

export default function BuscadorRecetas({ buscar, setBuscar }) {
  return (
    <View style={{padding:10}}>
      <Searchbar
        placeholder='Search'
        value={buscar}
        onChangeText={setBuscar}
      />
    </View>
  )
}

const styles = StyleSheet.create({})